"""Rooftop PV API. Geometry is recomputed server-side; one inverter group per face."""
import csv, math, os, logging
from pathlib import Path
from threading import BoundedSemaphore
from typing import Literal
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict
from database import Database
from pv import simulate_pv

ROOT = Path(__file__).resolve().parent
app = FastAPI(title='Ardian Rooftop PV', version='1.0.0')
app.add_middleware(CORSMiddleware, allow_origins=os.getenv('ALLOWED_ORIGINS',
    'https://ardiancandra.com,https://www.ardiancandra.com,https://acprakthse.github.io,http://localhost:8000').split(','),
    allow_methods=['GET','POST'], allow_headers=['Content-Type'])
slots = BoundedSemaphore(1)

class Design(BaseModel):
    model_config = ConfigDict(extra='forbid', allow_inf_nan=False)
    roof: Literal['flat','shed','gable'] = 'gable'
    width: float = Field(16, ge=2, le=100)
    depth: float = Field(12, ge=2, le=100)
    height: float = Field(5, ge=1, le=50)
    tilt: float = Field(20, ge=0, le=60)
    azimuth: float = Field(180, ge=0, lt=360)
    setback: float = Field(.5, ge=0, le=5)
    gap: float = Field(.05, ge=.01, le=1)
    row_gap: float = Field(.4, ge=.01, le=5)
    module_length: float = Field(2.28, ge=.3, le=4)
    module_width: float = Field(1.13, ge=.3, le=3)
    orientation: Literal['portrait','landscape'] = 'portrait'
    faces: Literal['both','first','second'] = 'both'
    module: str = Field(max_length=300)
    inverter: str = Field(max_length=300)
    modules_per_string: int = Field(10, ge=1, le=40)
    inverters_per_face: int = Field(1, ge=1, le=100)
    weather: Literal['natuna','bali'] = 'natuna'
    soiling: float = Field(3, ge=0, le=30)
    dc_loss: float = Field(2, ge=0, le=20)
    ac_loss: float = Field(1, ge=0, le=20)

def geometry(d):
    angle=math.radians(d.tilt)
    w,l=(d.module_width,d.module_length) if d.orientation=='portrait' else (d.module_length,d.module_width)
    span=d.depth/(2 if d.roof=='gable' else 1)
    length=span if d.roof=='flat' else span/math.cos(angle)
    footprint=l*math.cos(angle) if d.roof=='flat' else l
    gap=d.row_gap if d.roof=='flat' else d.gap
    cols=max(0,math.floor((d.width-2*d.setback+d.gap)/(w+d.gap)+1e-9))
    rows=max(0,math.floor((length-2*d.setback+gap)/(footprint+gap)+1e-9))
    capacity=cols*rows
    count=capacity//d.modules_per_string*d.modules_per_string
    ids=[0,1] if d.roof=='gable' and d.faces=='both' else [1 if d.roof=='gable' and d.faces=='second' else 0]
    return dict(cols=cols,rows=rows,capacity_per_face=capacity,modules_per_face=count,
                strings_per_face=count//d.modules_per_string,face_ids=ids,
                gcr=min(.99,l/(footprint+gap)) if d.roof=='flat' else .99)

@app.get('/health')
def health(): return {'status':'ok','engine':'PySAM Pvsamv1'}

@app.post('/simulate')
def simulate(d: Design):
    if not slots.acquire(blocking=False):
        raise HTTPException(429,'Simulasi lain sedang berjalan. Coba lagi setelah selesai.')
    try:
        g=geometry(d)
        if not g['modules_per_face']: raise ValueError('Atap tidak memuat satu string penuh. Kurangi modul/string atau perbesar atap.')
        if g['modules_per_face']*len(g['face_ids'])>3000: raise ValueError('Versi ini dibatasi 3.000 modul per simulasi.')
        db=Database();m=db.get_module(d.module);inv=db.get_inverter(d.inverter)
        weather=ROOT/'weather_data'/f'{d.weather}_weather.epw'
        with weather.open() as f:
            r=csv.reader(f);header=next(r)
            for _ in range(7): next(r)
            weather_rows=list(r)
        if len(weather_rows)!=8760: raise ValueError('Versi awal memerlukan EPW satu jam, 8.760 baris.')
        cold=min(float(r[6]) for r in weather_rows)
        voc=d.modules_per_string*(float(m['V_oc_ref'])+float(m['beta_oc'])*(min(cold,25)-25))
        vmp=d.modules_per_string*float(m['V_mp_ref'])
        if voc>float(inv['Vdcmax']): raise ValueError(f'Voc string pada suhu minimum cuaca {cold:.1f} °C = {voc:.0f} V, melebihi Vdcmax {inv["Vdcmax"]} V. Kurangi modul/string.')
        if not float(inv['Mppt_low'])<=vmp<=float(inv['Mppt_high']):
            raise ValueError(f'Vmp string STC {vmp:.0f} V berada di luar rentang MPPT inverter. Ubah modul/string atau inverter.')
        if g['strings_per_face']%d.inverters_per_face:
            raise ValueError('Jumlah string per bidang harus habis dibagi jumlah inverter per bidang.')
        outputs=[];power=None
        for face in g['face_ids']:
            df,result=simulate_pv(str(weather),d.module,d.inverter,d.tilt,(d.azimuth+180*face)%360,
                g['gcr'],d.modules_per_string,g['strings_per_face'],d.inverters_per_face,False,
                d.soiling,d.dc_loss,d.ac_loss)
            series=df.pv_power_kw.to_numpy()
            if len(series)!=8760 or not np.isfinite(series).all(): raise ValueError('Output PySAM tidak valid untuk resolusi satu jam.')
            power=series.copy() if power is None else power+series
            outputs.append(result)
        dc=sum(o['dc_capacity_kw'] for o in outputs);ac=sum(o['ac_capacity_kw'] for o in outputs)
        annual=sum(o['annual_energy_kwh'] for o in outputs)
        if not math.isclose(float(power.sum()),annual,rel_tol=1e-5,abs_tol=.1):
            raise ValueError('Energi tahunan tidak konsisten dengan profil per jam.')
        months=[sum(float(p) for p,r in zip(power,weather_rows) if int(r[1])==mo) for mo in range(1,13)]
        warnings=['Bayangan antarbaris dan objek sekitar belum dihitung.',
            'Setiap bidang memakai kelompok inverter terpisah; bukan satu inverter bersama.',
            'Pemeriksaan listrik awal: Voc terhadap suhu minimum EPW dan Vmp STC. Batas arus/MPPT per input, suhu ekstrem desain, dan proteksi belum diverifikasi.',
            'Model termal menggunakan pengaturan bawaan SAM; pengaruh ventilasi pemasangan rooftop belum dikalibrasi.',
            'Dimensi modul adalah input pengguna; verifikasi terhadap datasheet.']
        if dc/ac>1.5 or dc/ac<.8: warnings.append('Rasio DC/AC di luar 0,8–1,5. Tinjau jumlah/kapasitas inverter; clipping dihitung oleh PySAM.')
        return {'engine':'PySAM Pvsamv1','design':d.model_dump(),'geometry':g,
            'dc_kw':dc,'ac_kw':ac,'dc_ac_ratio':dc/ac,'annual_kwh':annual,
            'specific_yield':annual/dc,'capacity_factor_dc':100*annual/(dc*8760),
            'monthly_kwh':months,'hourly_kw':power.tolist(),'timestep_hours':1,
            'weather_location':header[1:4], 'faces':outputs,'warnings':warnings,
            'assumptions':{'soiling_percent':d.soiling,'dc_wiring_percent':d.dc_loss,'ac_wiring_percent':d.ac_loss,
             'mismatch_percent':2,'diode_connection_percent':.5,'shading':'not modeled','bifacial':False}}
    except ValueError as e: raise HTTPException(422,str(e))
    except Exception:
        logging.exception('PySAM simulation failed')
        raise HTTPException(500,'PySAM gagal menjalankan konfigurasi ini. Periksa log backend dan parameter peralatan.')
    finally: slots.release()
