export const seriesSpec=[
 ['pv_ac_kw','PV','#b77912'],['effective_load_kw','Beban sistem','#263b51'],
 ['milp_charge_kw','Charge','#168578'],['milp_discharge_kw','Discharge','#8854bd'],
 ['milp_grid_import_kw','Impor jaringan','#c04c42'],['milp_grid_export_kw','Ekspor jaringan','#397cac']
];
export function dailyProfile(hourly,mode='day',day=1){
 if(!['day','average'].includes(mode)||!Number.isInteger(day)||day<1||day>365)throw Error('Pilihan hari tidak valid.');
 const keys=[...seriesSpec.map(x=>x[0]),'milp_soc_pct'];const out={};
 for(const key of keys){const a=hourly[key];if(!Array.isArray(a)||a.length!==8760||a.some(x=>!Number.isFinite(x)))throw Error('Profil per jam tidak lengkap.');
 out[key]=Array.from({length:24},(_,h)=>mode==='day'?a[(day-1)*24+h]:Array.from({length:365},(_,d)=>a[d*24+h]).reduce((s,x)=>s+x,0)/365);}
 return out;
}
export function dayLabel(day){return new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'long',timeZone:'UTC'}).format(new Date(Date.UTC(2025,0,day)));}
export function chartSVG(profile,soc=false){
 const specs=soc?[['milp_soc_pct','SOC akhir interval','#168578']]:seriesSpec;
 const W=900,H=soc?220:320,left=62,right=24,top=25,bottom=48,w=W-left-right,h=H-top-bottom;
 const values=specs.flatMap(([k])=>profile[k]);const min=soc?0:Math.min(0,...values),max=soc?100:Math.max(1,...values)*1.08;
 const x=i=>left+i*w/23,y=v=>top+(max-v)*h/(max-min),f=v=>Number(v.toFixed(2));
 let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${soc?'SOC baterai':'Daya PV, beban, dan dispatch MILP'}" xmlns="http://www.w3.org/2000/svg"><rect width="900" height="${H}" fill="white"/>`;
 for(let i=0;i<=4;i++){const v=min+(max-min)*i/4;s+=`<path d="M${left} ${y(v)}H${W-right}" stroke="#dfe7e3"/><text x="${left-10}" y="${y(v)+4}" text-anchor="end">${f(v)}</text>`;}
 for(let i=0;i<24;i+=3)s+=`<text x="${x(i)}" y="${H-24}" text-anchor="middle">${String(i).padStart(2,'0')}:00</text>`;
 s+=`<text x="15" y="15">${soc?'SOC (%)':'kW AC'}</text><text x="${W/2}" y="${H-3}" text-anchor="middle">Jam lokal EPW · awal interval satu jam</text>`;
 for(const [key,label,color] of specs){s+=`<polyline fill="none" stroke="${color}" stroke-width="2.4" points="${profile[key].map((v,i)=>`${x(i)},${y(v)}`).join(' ')}"/>`;profile[key].forEach((v,i)=>{s+=`<circle cx="${x(i)}" cy="${y(v)}" r="3" fill="${color}"><title>${label} · ${String(i).padStart(2,'0')}:00–${String(i+1).padStart(2,'0')}:00: ${f(v)} ${soc?'%':'kW'}</title></circle>`;});}
 return s+'</svg>';
}
