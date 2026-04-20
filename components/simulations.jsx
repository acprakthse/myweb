/* global React, PARETO, CHEMISTRIES */
/* Four simulation sub-modules */

const { useState, useMemo, useEffect } = React;

/* ====================================================================
   Shared: simplified cost model calibrated to the thesis numbers
   ==================================================================== */
function computeMetrics(capKwh, pwrKw, chemKey = 'lfp', baselinePeak = 1010) {
  const chem = CHEMISTRIES.find(c => c.key === chemKey) || CHEMISTRIES[0];
  // CAPEX — unit costs scale mildly with size (economies of scale)
  const scale = Math.max(0.85, Math.min(1.15, 1.2 - Math.log10(capKwh) * 0.08));
  const usdPerKwh = chem.capex * scale;
  const eurPerKwh = usdPerKwh * 0.9241;
  const capexBess = capKwh * eurPerKwh;
  const capexPv = 630000; // fixed PV baseline from thesis (839 kWp passenger proxy)
  const totalCapex = capexBess + capexPv;

  // CO2 saved scales with capacity & RTE; caps at ~220 tCO2 lifetime
  const co2 = Math.min(220, (capKwh * 0.09 + pwrKw * 0.015) * (chem.rte / 91));

  // peak shaving bounded by power (typical: power ~ shaving, capped at 704)
  const peak = Math.min(704, pwrKw * 0.92);

  // LCOE — base 77 EUR/MWh for tiny systems, grows with capex & shrinks slightly with utilisation
  const utilisation = Math.min(1, 500 / capKwh);
  const lcoe = 77 + (totalCapex - 632000) / 4500 * (1 + (1 - chem.rte / 91) * 0.4) - utilisation * 8;

  // NPV — 25yr, heuristic: rewards peak-shaving + CO2, penalises capex
  const npv =
    peak * 650 * 25 * 0.5 +   // peak fee avoided
    co2 * 400 +               // ets + rec value proxy
    capKwh * 15 -             // arbitrage
    totalCapex * 0.85;

  return {
    capKwh, pwrKw,
    cRate: pwrKw / capKwh,
    duration: capKwh / pwrKw,
    capex: totalCapex,
    capexBess,
    co2,
    peak,
    peakPct: (peak / baselinePeak) * 100,
    lcoe: Math.max(65, lcoe),
    npv,
    rte: chem.rte,
  };
}

const fmt = {
  int: (n) => Math.round(n).toLocaleString('en-US'),
  eur0: (n) => '€' + Math.round(n).toLocaleString('en-US'),
  eurK: (n) => (n >= 0 ? '€' : '−€') + Math.abs(Math.round(n / 1000)).toLocaleString('en-US') + 'k',
  eurM: (n) => (n >= 0 ? '€' : '−€') + (Math.abs(n) / 1e6).toFixed(2) + 'M',
  kw: (n) => Math.round(n).toLocaleString() + ' kW',
  kwh: (n) => Math.round(n).toLocaleString() + ' kWh',
  t: (n) => n.toFixed(1) + ' t',
  pct: (n) => n.toFixed(0) + '%',
  hr: (n) => n.toFixed(2) + ' h',
  num: (n, d=2) => n.toFixed(d),
};

/* ==================== TAB 1 · SIZING ==================== */
const SizingTab = ({ lang }) => {
  const [cap, setCap] = useState(1146);
  const [pwr, setPwr] = useState(1010);
  const [chem, setChem] = useState('lfp');
  const m = useMemo(() => computeMetrics(cap, pwr, chem), [cap, pwr, chem]);

  const L = lang === 'id' ? {
    h: 'Ukur sistem BESS',
    s: 'Geser kapasitas dan daya. Semua metrik dihitung ulang langsung.',
    cap: 'Kapasitas',
    pwr: 'Daya',
    chem: 'Kimia baterai',
    cRate: 'C-rate',
    duration: 'Durasi',
    lcoe: 'LCOE',
    npv: 'NPV 25 thn',
    co2: 'CO₂ dihindari',
    peak: 'Peak shaving',
    capex: 'CAPEX total',
    topsis: 'Muat solusi TOPSIS',
  } : {
    h: 'Size the BESS',
    s: 'Slide capacity and power. Every metric recomputes live.',
    cap: 'Capacity',
    pwr: 'Power',
    chem: 'Chemistry',
    cRate: 'C-rate',
    duration: 'Duration',
    lcoe: 'LCOE',
    npv: 'NPV 25 yr',
    co2: 'CO₂ avoided',
    peak: 'Peak shaving',
    capex: 'Total CAPEX',
    topsis: 'Load TOPSIS pick',
  };

  return (
    <div>
      <h3 style={{marginBottom: 8}}>{L.h}</h3>
      <p className="muted" style={{marginTop: 0, marginBottom: 32, maxWidth: 640}}>{L.s}</p>

      <div style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1.1fr)', gap: 48}} className="sizing-grid">
        <div>
          {/* capacity */}
          <div className="slider-row">
            <span className="label">{L.cap} · kWh</span>
            <span className="value">{fmt.int(cap)}<span style={{fontSize:13, color:'var(--mute)', marginLeft:6}}>kWh</span></span>
          </div>
          <input type="range" min="100" max="4000" step="10" value={cap} onChange={e=>setCap(+e.target.value)} />

          {/* power */}
          <div className="slider-row">
            <span className="label">{L.pwr} · kW</span>
            <span className="value">{fmt.int(pwr)}<span style={{fontSize:13, color:'var(--mute)', marginLeft:6}}>kW</span></span>
          </div>
          <input type="range" min="100" max="4000" step="10" value={pwr} onChange={e=>setPwr(+e.target.value)} />

          {/* derived */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 20, marginBottom: 24}}>
            <div className="metric" style={{borderLeftColor:'var(--terra)'}}>
              <div className="metric-label">{L.cRate}</div>
              <div className="metric-value">{fmt.num(m.cRate, 2)}<span className="unit">C</span></div>
            </div>
            <div className="metric" style={{borderLeftColor:'var(--terra)'}}>
              <div className="metric-label">{L.duration}</div>
              <div className="metric-value">{fmt.num(m.duration, 2)}<span className="unit">h</span></div>
            </div>
          </div>

          {/* chemistry selector */}
          <div className="slider-row" style={{marginTop: 8}}>
            <span className="label">{L.chem}</span>
            <span />
          </div>
          <div style={{display:'flex', gap: 6, marginBottom: 24}}>
            {CHEMISTRIES.map(c => (
              <button key={c.key}
                onClick={() => setChem(c.key)}
                style={{
                  flex: 1, padding: '10px 8px',
                  fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  border: '1px solid ' + (chem === c.key ? 'var(--forest-2)' : 'var(--line-strong)'),
                  background: chem === c.key ? 'var(--forest-2)' : 'transparent',
                  color: chem === c.key ? 'var(--cream)' : 'var(--forest-2)',
                  borderRadius: 999, cursor: 'pointer',
                }}>
                {c.name}
              </button>
            ))}
          </div>

          <button className="btn btn-ghost"
            onClick={() => { setCap(1146); setPwr(1010); setChem('lfp'); }}
            style={{fontSize:12}}>
            ↺ {L.topsis}
          </button>
        </div>

        {/* right: big metrics */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 24}}>
          <div className="metric">
            <div className="metric-label">{L.lcoe}</div>
            <div className="metric-value">{fmt.num(m.lcoe, 1)}<span className="unit">€/MWh</span></div>
          </div>
          <div className="metric">
            <div className="metric-label">{L.npv}</div>
            <div className="metric-value" style={{color: m.npv >= 0 ? 'var(--forest)' : 'var(--terra)'}}>
              {fmt.eurK(m.npv)}
            </div>
          </div>
          <div className="metric">
            <div className="metric-label">{L.co2}</div>
            <div className="metric-value">{fmt.num(m.co2, 1)}<span className="unit">tCO₂</span></div>
          </div>
          <div className="metric">
            <div className="metric-label">{L.peak}</div>
            <div className="metric-value">{fmt.int(m.peak)}<span className="unit">kW</span></div>
          </div>
          <div className="metric" style={{gridColumn: 'span 2'}}>
            <div className="metric-label">{L.capex}</div>
            <div className="metric-value">{fmt.eurM(m.capex)}</div>
            <div className="mono" style={{color:'var(--mute)', marginTop: 6}}>
              BESS {fmt.eurK(m.capexBess)} &nbsp;·&nbsp; PV {fmt.eurK(630000)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ==================== TAB 2 · CHEMISTRY ==================== */
const ChemistryTab = ({ lang }) => {
  const L = lang === 'id' ? {
    h: 'Bandingkan kimia baterai',
    s: 'Tiga kandidat teknologi untuk terminal Sm\u00e5landshamn: LFP, Natrium-ion, dan flow Hidrogen-Bromin.',
    rte: 'RTE',
    cycles: 'Siklus max',
    cal: 'Calendar fade',
    dur: 'Durasi',
    cr: 'C-rate',
    capex: 'CAPEX (1 MW · 4 h)',
    calLife: 'Umur kalender',
    replace: 'Biaya ganti',
  } : {
    h: 'Compare battery chemistries',
    s: 'Three candidate technologies for the Sm\u00e5landshamn terminal: LFP, Sodium-ion, and Hydrogen-Bromine flow.',
    rte: 'RTE',
    cycles: 'Max cycles',
    cal: 'Calendar fade',
    dur: 'Duration',
    cr: 'C-rate',
    capex: 'CAPEX (1 MW · 4 h)',
    calLife: 'Calendar life',
    replace: 'Replacement cost',
  };

  // Normalise radar values
  const axes = [
    { key: 'rte', label: L.rte, max: 100, get: c => c.rte },
    { key: 'cycles', label: L.cycles, max: 15000, get: c => c.cycles },
    { key: 'duration', label: L.dur, max: 8, get: c => {
      const [min, max] = c.duration.split(' – ').map(s => parseFloat(s));
      return (min + max) / 2;
    }},
    { key: 'cost', label: 'Cost eff.', max: 600, get: c => 600 - c.capex },
    { key: 'cal', label: lang === 'id' ? 'UMUR' : 'CAL. LIFE', max: 20, get: c => c.calLife },
  ];

  const cx = 200, cy = 200, R = 150;
  const n = axes.length;

  const point = (value, max, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const r = (value / max) * R;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };

  return (
    <div>
      <h3 style={{marginBottom: 8}}>{L.h}</h3>
      <p className="muted" style={{marginTop: 0, marginBottom: 32, maxWidth: 640}}>{L.s}</p>

      <div style={{display:'grid', gridTemplateColumns:'420px 1fr', gap: 48}} className="chem-grid">
        {/* radar */}
        <div className="chart-surface" style={{padding: 24}}>
          <svg viewBox="0 0 400 400" style={{width:'100%', height:'auto'}}>
            {/* grid rings */}
            {[0.25, 0.5, 0.75, 1].map(r => {
              const pts = axes.map((_, i) => {
                const a = (i / n) * Math.PI * 2 - Math.PI / 2;
                return `${cx + Math.cos(a) * R * r},${cy + Math.sin(a) * R * r}`;
              }).join(' ');
              return <polygon key={r} points={pts} fill="none" stroke="var(--line)" />;
            })}
            {/* axis lines */}
            {axes.map((_, i) => {
              const a = (i / n) * Math.PI * 2 - Math.PI / 2;
              return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(a) * R} y2={cy + Math.sin(a) * R} stroke="var(--line)" />;
            })}
            {/* axis labels */}
            {axes.map((ax, i) => {
              const a = (i / n) * Math.PI * 2 - Math.PI / 2;
              const lx = cx + Math.cos(a) * (R + 24);
              const ly = cy + Math.sin(a) * (R + 24);
              return (
                <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                  style={{fontFamily:'var(--mono)', fontSize: 10, fill:'var(--mute)', letterSpacing:'0.08em', textTransform:'uppercase'}}>
                  {ax.label}
                </text>
              );
            })}
            {/* polygons */}
            {CHEMISTRIES.map((c, ci) => {
              const pts = axes.map((ax, i) => point(ax.get(c), ax.max, i).join(',')).join(' ');
              const fill = c.key === 'lfp' ? 'rgba(27,67,50,0.12)' : c.key === 'naion' ? 'rgba(244,162,97,0.18)' : 'rgba(38,70,83,0.15)';
              const stroke = c.key === 'lfp' ? 'var(--forest)' : c.key === 'naion' ? 'var(--ochre)' : 'var(--slate)';
              return (
                <g key={c.key}>
                  <polygon points={pts} fill={fill} stroke={stroke} strokeWidth="2" />
                  {axes.map((ax, i) => {
                    const [px, py] = point(ax.get(c), ax.max, i);
                    return <circle key={i} cx={px} cy={py} r="3.5" fill={stroke} />;
                  })}
                </g>
              );
            })}
          </svg>
          <div style={{display:'flex', justifyContent:'center', gap: 18, marginTop: 8, flexWrap:'wrap'}}>
            {CHEMISTRIES.map(c => (
              <div key={c.key} style={{display:'flex', alignItems:'center', gap: 6, fontFamily:'var(--mono)', fontSize: 11}}>
                <span style={{width:10, height:10, background: c.key === 'lfp' ? 'var(--forest)' : c.key === 'naion' ? 'var(--ochre)' : 'var(--slate)', display:'inline-block', borderRadius: 2}}/>
                {c.name}
              </div>
            ))}
          </div>
        </div>

        {/* detail table */}
        <div>
          <table style={{width:'100%', borderCollapse:'collapse', fontSize: 14}}>
            <thead>
              <tr style={{borderBottom: '1px solid var(--line-strong)'}}>
                <th style={{textAlign:'left', padding:'14px 0', fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.1em', color:'var(--mute)', textTransform:'uppercase', fontWeight:500}}></th>
                {CHEMISTRIES.map(c => (
                  <th key={c.key} style={{textAlign:'right', padding:'14px 0', fontFamily:'var(--serif)', fontSize:20, fontWeight:400, color:'var(--forest-2)'}}>
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                [L.rte, c => c.rte + ' %'],
                [L.cycles, c => c.cycles.toLocaleString()],
                [L.cal, c => c.calFade + ' %/yr'],
                [L.dur, c => c.duration],
                [L.cr, c => c.cRate + ' C'],
                [L.capex, c => '$' + c.capex + '/kWh'],
                [L.calLife, c => c.calLife + ' yr'],
                [L.replace, c => c.replaceFrac + '% of CAPEX'],
              ].map(([label, val], i) => (
                <tr key={i} style={{borderBottom: '1px solid var(--line)'}}>
                  <td style={{padding:'13px 0', fontFamily:'var(--mono)', fontSize:11, color:'var(--mute)', letterSpacing:'0.08em', textTransform:'uppercase'}}>{label}</td>
                  {CHEMISTRIES.map(c => (
                    <td key={c.key} style={{textAlign:'right', padding:'13px 0', fontVariantNumeric: 'tabular-nums'}}>{val(c)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{marginTop: 24, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 16}}>
            {CHEMISTRIES.map(c => (
              <div key={c.key} style={{padding: 16, background:'var(--paper)', border:'1px solid var(--line)', borderRadius:10}}>
                <div style={{fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--terra)', marginBottom: 6}}>{c.full}</div>
                <p style={{fontSize: 13, margin: 0, lineHeight: 1.5}}>{c.notes[lang]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 1000px) {
          .chem-grid { grid-template-columns: 1fr !important; }
          .sizing-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

/* ==================== TAB 3 · 24H DISPATCH ==================== */
const DispatchTab = ({ lang }) => {
  const [capKwh, setCapKwh] = useState(1146);
  const [pwrKw, setPwrKw] = useState(1010);

  // 24h synthetic profile — PV, shore-power load, BESS dispatch, SoC
  const hours = Array.from({ length: 25 }, (_, h) => h);
  const data = useMemo(() => {
    const pv = hours.map(h => {
      // bell curve, peaks at 840 kW for ~12
      const bell = Math.max(0, Math.exp(-Math.pow((h - 12.5) / 3.5, 2)));
      return bell * 680; // kW ac clipped
    });
    const load = hours.map(h => {
      // base + 2 ship events (peak 2465 kW)
      let l = 120;
      if (h >= 6 && h <= 10) l += 1800 * Math.max(0, 1 - Math.abs(h - 8) / 2.5);
      if (h >= 16 && h <= 22) l += 2100 * Math.max(0, 1 - Math.abs(h - 19) / 3.2);
      return l;
    });

    const pMax = pwrKw;
    const eMax = capKwh * 0.9; // usable 10-90%
    const eMin = capKwh * 0.1;
    let soc = capKwh * 0.5;
    const socArr = []; const bessArr = []; const gridArr = [];
    hours.forEach((h, i) => {
      const net = pv[i] - load[i]; // positive = surplus, negative = deficit
      let b = 0;
      if (net > 0) {
        // charge
        b = -Math.min(net, pMax, (eMax - soc));
        soc -= b; // b negative -> add
      } else {
        // discharge
        b = Math.min(-net, pMax, (soc - eMin));
        soc -= b;
      }
      bessArr.push(b); // +discharge, -charge
      socArr.push(soc);
      gridArr.push(load[i] - pv[i] - b);
    });
    return { pv, load, bess: bessArr, soc: socArr, grid: gridArr };
  }, [capKwh, pwrKw]);

  const L = lang === 'id' ? {
    h: 'Simulator dispatch 24 jam',
    s: 'Profil sintetis PV + beban shore-power kapal + dispatch BESS. SoC dijaga 10–90%.',
    cap: 'Kapasitas', pwr: 'Daya',
    pv: 'Produksi PV',
    load: 'Beban (OPS + terminal)',
    grid: 'Impor grid',
    bess: 'Dispatch BESS',
    soc: 'State of Charge',
    hour: 'Jam',
  } : {
    h: '24-hour dispatch simulator',
    s: 'Synthetic PV + ship shore-power load + BESS dispatch. SoC clamped 10–90%.',
    cap: 'Capacity', pwr: 'Power',
    pv: 'PV generation',
    load: 'Load (OPS + terminal)',
    grid: 'Grid import',
    bess: 'BESS dispatch',
    soc: 'State of Charge',
    hour: 'Hour',
  };

  // chart geom
  const W = 900, H = 320, P = { l: 50, r: 20, t: 20, b: 40 };
  const iw = W - P.l - P.r, ih = H - P.t - P.b;
  const yMaxPower = Math.max(...data.load, ...data.pv) * 1.1 || 3000;
  const x = i => P.l + (i / 24) * iw;
  const y = v => P.t + ih - (v / yMaxPower) * ih;
  const ySoc = v => P.t + ih - (v / capKwh) * ih;

  const pathFrom = arr => arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');
  const areaFrom = arr => pathFrom(arr) + ` L ${x(24)} ${P.t + ih} L ${P.l} ${P.t + ih} Z`;

  return (
    <div>
      <h3 style={{marginBottom: 8}}>{L.h}</h3>
      <p className="muted" style={{marginTop: 0, marginBottom: 24, maxWidth: 680}}>{L.s}</p>

      <div style={{display:'flex', gap: 24, flexWrap:'wrap', marginBottom: 24}}>
        <div style={{flex:1, minWidth: 260}}>
          <div className="slider-row">
            <span className="label">{L.cap} · kWh</span>
            <span className="value" style={{fontSize:18}}>{fmt.int(capKwh)}</span>
          </div>
          <input type="range" min="100" max="4000" step="10" value={capKwh} onChange={e=>setCapKwh(+e.target.value)} />
        </div>
        <div style={{flex:1, minWidth: 260}}>
          <div className="slider-row">
            <span className="label">{L.pwr} · kW</span>
            <span className="value" style={{fontSize:18}}>{fmt.int(pwrKw)}</span>
          </div>
          <input type="range" min="100" max="4000" step="10" value={pwrKw} onChange={e=>setPwrKw(+e.target.value)} />
        </div>
      </div>

      <div className="chart-surface">
        <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%', height:'auto'}}>
          {/* grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
            <g key={i}>
              <line x1={P.l} x2={W - P.r} y1={P.t + ih * (1 - t)} y2={P.t + ih * (1 - t)} stroke="var(--line)" />
              <text x={P.l - 8} y={P.t + ih * (1 - t) + 4} textAnchor="end" style={{fontFamily:'var(--mono)', fontSize:10, fill:'var(--mute)'}}>
                {Math.round(yMaxPower * t)}
              </text>
            </g>
          ))}
          {/* x axis hours */}
          {[0, 6, 12, 18, 24].map(h => (
            <text key={h} x={x(h)} y={H - 12} textAnchor="middle" style={{fontFamily:'var(--mono)', fontSize:10, fill:'var(--mute)'}}>
              {h.toString().padStart(2,'0')}:00
            </text>
          ))}

          {/* grid import (background area) */}
          <path d={areaFrom(data.grid.map(v => Math.max(0, v)))} fill="rgba(38,70,83,0.12)" />
          {/* load line */}
          <path d={pathFrom(data.load)} fill="none" stroke="var(--terra)" strokeWidth="2.4" />
          {/* pv area */}
          <path d={areaFrom(data.pv)} fill="rgba(244,162,97,0.35)" stroke="var(--ochre)" strokeWidth="1.8" />
          {/* bess bars */}
          {data.bess.map((v, i) => {
            const w = iw / 24 * 0.7;
            const bx = x(i + 0.5) - w / 2;
            const y0 = P.t + ih * ((yMaxPower - 0) / yMaxPower); // baseline on chart is 0 line
            // anchor bess bars to a mid-line for visibility: use a second y-scale
            const bRange = Math.max(pwrKw, 100);
            const bscale = v2 => (v2 / bRange) * 60; // 60px half-height
            const mid = P.t + ih - 10;
            const h0 = bscale(v);
            return (
              <rect key={i}
                x={bx} y={h0 >= 0 ? mid - h0 : mid}
                width={w} height={Math.abs(h0)}
                fill={v >= 0 ? 'var(--sage)' : 'var(--forest)'}
                opacity="0.75" />
            );
          })}
          {/* SoC line (secondary axis — normalized to capacity) */}
          <path d={data.soc.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${ySoc(v)}`).join(' ')}
            fill="none" stroke="var(--slate)" strokeWidth="2" strokeDasharray="4 4" />

          {/* frame */}
          <rect x={P.l} y={P.t} width={iw} height={ih} fill="none" stroke="var(--line-strong)" />
        </svg>

        {/* legend */}
        <div style={{display:'flex', gap: 24, flexWrap:'wrap', marginTop: 16, fontFamily:'var(--mono)', fontSize: 11}}>
          <LegendDot color="var(--ochre)" label={L.pv} />
          <LegendDot color="var(--terra)" label={L.load} />
          <LegendDot color="rgba(38,70,83,0.4)" label={L.grid} />
          <LegendDot color="var(--sage)" label={L.bess + ' (+)'} />
          <LegendDot color="var(--forest)" label={L.bess + ' (−)'} />
          <LegendDot color="var(--slate)" label={L.soc} dashed />
        </div>
      </div>
    </div>
  );
};

const LegendDot = ({ color, label, dashed }) => (
  <span style={{display:'inline-flex', alignItems:'center', gap: 8, color:'var(--forest-2)'}}>
    <span style={{
      width: 20, height: dashed ? 0 : 10,
      borderTop: dashed ? `2px dashed ${color}` : 'none',
      background: dashed ? 'transparent' : color,
      display:'inline-block', borderRadius: 2,
    }}/>
    {label}
  </span>
);

/* ==================== TAB 4 · PARETO ==================== */
const ParetoTab = ({ lang }) => {
  const [hover, setHover] = useState(null);
  const [selected, setSelected] = useState(1);
  const [xAxis, setXAxis] = useState('capex');
  const [yAxis, setYAxis] = useState('npv');

  const options = [
    { key: 'capex', label: lang === 'id' ? 'CAPEX (€)' : 'CAPEX (€)', get: p => p.capex },
    { key: 'npv', label: lang === 'id' ? 'NPV 25 thn (€)' : 'NPV 25 yr (€)', get: p => p.npv },
    { key: 'co2', label: lang === 'id' ? 'CO₂ dihindari (t)' : 'CO₂ avoided (t)', get: p => p.co2 },
    { key: 'lcoe', label: lang === 'id' ? 'LCOE (€/MWh)' : 'LCOE (€/MWh)', get: p => p.lcoe },
    { key: 'peak', label: lang === 'id' ? 'Peak shaving (kW)' : 'Peak shaving (kW)', get: p => p.peak },
    { key: 'cap', label: lang === 'id' ? 'Kapasitas (kWh)' : 'Capacity (kWh)', get: p => p.cap },
  ];

  const xOpt = options.find(o => o.key === xAxis);
  const yOpt = options.find(o => o.key === yAxis);

  const xVals = PARETO.map(xOpt.get);
  const yVals = PARETO.map(yOpt.get);
  const xMin = Math.min(...xVals), xMax = Math.max(...xVals);
  const yMin = Math.min(...yVals), yMax = Math.max(...yVals);

  const W = 780, H = 440, P = { l: 80, r: 40, t: 30, b: 60 };
  const iw = W - P.l - P.r, ih = H - P.t - P.b;
  const xs = v => P.l + ((v - xMin) / (xMax - xMin || 1)) * iw;
  const ys = v => P.t + ih - ((v - yMin) / (yMax - yMin || 1)) * ih;

  const L = lang === 'id' ? {
    h: 'Frontier Pareto — NSGA-II',
    s: '10 solusi non-dominan dari optimasi multi-objektif NSGA-II (CO₂ ↑, peak-shaving ↑, LCOE ↓, NPV ↑, CAPEX ↓). Pilih sumbu lalu klik titik untuk detail.',
    x: 'Sumbu X', y: 'Sumbu Y',
    detail: 'Detail solusi',
    cap: 'Kapasitas', pwr: 'Daya', cr: 'C-rate', dur: 'Durasi',
    co2: 'CO₂', peak: 'Peak-shav.', lcoe: 'LCOE', npv: 'NPV', capex: 'CAPEX',
    topsis: 'Pilihan TOPSIS',
  } : {
    h: 'Pareto frontier — NSGA-II',
    s: '10 non-dominated solutions from multi-objective NSGA-II (CO₂ ↑, peak-shaving ↑, LCOE ↓, NPV ↑, CAPEX ↓). Pick axes then click a point for details.',
    x: 'X axis', y: 'Y axis',
    detail: 'Solution detail',
    cap: 'Capacity', pwr: 'Power', cr: 'C-rate', dur: 'Duration',
    co2: 'CO₂', peak: 'Peak-shav.', lcoe: 'LCOE', npv: 'NPV', capex: 'CAPEX',
    topsis: 'TOPSIS pick',
  };

  const sel = PARETO[selected];

  return (
    <div>
      <h3 style={{marginBottom: 8}}>{L.h}</h3>
      <p className="muted" style={{marginTop: 0, marginBottom: 24, maxWidth: 720}}>{L.s}</p>

      <div style={{display:'flex', gap: 20, marginBottom: 16, flexWrap:'wrap'}}>
        <AxisPicker label={L.x} value={xAxis} onChange={setXAxis} options={options} />
        <AxisPicker label={L.y} value={yAxis} onChange={setYAxis} options={options} />
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 320px', gap: 32}} className="pareto-grid">
        <div className="chart-surface">
          <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%', height:'auto'}}>
            {/* grid */}
            {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
              <g key={`gy-${i}`}>
                <line x1={P.l} x2={W - P.r} y1={P.t + ih * (1 - t)} y2={P.t + ih * (1 - t)} stroke="var(--line)" />
                <text x={P.l - 10} y={P.t + ih * (1 - t) + 4} textAnchor="end" style={{fontFamily:'var(--mono)', fontSize:10, fill:'var(--mute)'}}>
                  {formatAxisValue(yMin + (yMax - yMin) * t, yOpt.key)}
                </text>
              </g>
            ))}
            {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
              <g key={`gx-${i}`}>
                <line x1={P.l + iw * t} x2={P.l + iw * t} y1={P.t} y2={P.t + ih} stroke="var(--line)" />
                <text x={P.l + iw * t} y={H - 30} textAnchor="middle" style={{fontFamily:'var(--mono)', fontSize:10, fill:'var(--mute)'}}>
                  {formatAxisValue(xMin + (xMax - xMin) * t, xOpt.key)}
                </text>
              </g>
            ))}
            {/* frame */}
            <rect x={P.l} y={P.t} width={iw} height={ih} fill="none" stroke="var(--line-strong)" />
            {/* axis labels */}
            <text x={P.l + iw / 2} y={H - 8} textAnchor="middle"
              style={{fontFamily:'var(--mono)', fontSize:11, fill:'var(--forest-2)', letterSpacing:'0.08em', textTransform:'uppercase'}}>
              {xOpt.label}
            </text>
            <text x={24} y={P.t + ih / 2} textAnchor="middle" transform={`rotate(-90 24 ${P.t + ih/2})`}
              style={{fontFamily:'var(--mono)', fontSize:11, fill:'var(--forest-2)', letterSpacing:'0.08em', textTransform:'uppercase'}}>
              {yOpt.label}
            </text>

            {/* points */}
            {PARETO.map((p, i) => {
              const cx2 = xs(xOpt.get(p));
              const cy2 = ys(yOpt.get(p));
              const r = 8 + (p.cap / 4000) * 10;
              const isSel = i === selected;
              const isHov = i === hover;
              return (
                <g key={i} style={{cursor:'pointer'}}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setSelected(i)}>
                  <circle cx={cx2} cy={cy2} r={r}
                    fill={p.npv >= 0 ? 'rgba(82,183,136,0.35)' : 'rgba(196,69,54,0.25)'}
                    stroke={isSel ? 'var(--terra)' : (p.npv >= 0 ? 'var(--forest)' : 'var(--terra)')}
                    strokeWidth={isSel ? 3 : 1.8} />
                  {(isSel || isHov) && (
                    <text x={cx2} y={cy2 - r - 6} textAnchor="middle"
                      style={{fontFamily:'var(--mono)', fontSize:10, fill:'var(--forest-2)'}}>
                      #{i + 1}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          <div style={{fontFamily:'var(--mono)', fontSize:10, color:'var(--mute)', marginTop: 12, letterSpacing:'0.05em'}}>
            ● {lang === 'id' ? 'Ukuran titik = kapasitas · warna = NPV' : 'Point size = capacity · colour = NPV sign'}
          </div>
        </div>

        {/* detail */}
        <div>
          <div style={{padding: 24, border:'1px solid var(--forest-2)', borderRadius: 14, background: 'var(--forest-2)', color:'var(--cream)'}}>
            <div style={{fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--sage-2)'}}>
              {L.detail} · #{selected + 1}
              {selected === 1 && <span style={{marginLeft: 8, color:'var(--ochre-2)'}}>★ {L.topsis}</span>}
            </div>
            <div style={{fontFamily:'var(--serif)', fontSize: 32, marginTop: 8, lineHeight: 1.1}}>
              {fmt.int(sel.cap)} kWh<br/>
              <span style={{color:'var(--sage-2)'}}>× {fmt.int(sel.pwr)} kW</span>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 14, marginTop: 20, fontSize: 13}}>
              <div><DetailRow l={L.cr} v={fmt.num(sel.cRate, 2) + ' C'} /></div>
              <div><DetailRow l={L.dur} v={fmt.num(sel.duration, 2) + ' h'} /></div>
              <div><DetailRow l={L.co2} v={fmt.num(sel.co2, 1) + ' t'} /></div>
              <div><DetailRow l={L.peak} v={fmt.int(sel.peak) + ' kW'} /></div>
              <div><DetailRow l={L.lcoe} v={fmt.num(sel.lcoe, 1) + ' €/MWh'} /></div>
              <div><DetailRow l={L.npv} v={fmt.eurK(sel.npv)} color={sel.npv >= 0 ? 'var(--sage-2)' : 'var(--ochre-2)'} /></div>
              <div style={{gridColumn: 'span 2'}}><DetailRow l={L.capex} v={fmt.eurM(sel.capex)} /></div>
            </div>
          </div>
          <div style={{marginTop: 16, fontSize: 13, color:'var(--mute)', lineHeight: 1.5}}>
            {lang === 'id'
              ? 'Pilihan TOPSIS (#2) meminimalkan jarak ke solusi ideal di 5 dimensi objektif. Inilah titik start untuk MILP dispatch tahunan.'
              : 'TOPSIS pick (#2) minimises distance to the ideal solution across all 5 objectives. This is the starting point for the full-year MILP dispatch.'}
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 1000px) {
          .pareto-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

function formatAxisValue(v, key) {
  if (key === 'capex' || key === 'npv') {
    return (v/1000).toFixed(0) + 'k';
  }
  if (key === 'co2' || key === 'peak' || key === 'cap') return Math.round(v).toString();
  return v.toFixed(0);
}

const AxisPicker = ({ label, value, onChange, options }) => (
  <label style={{display:'flex', flexDirection:'column', gap: 6}}>
    <span className="mono" style={{fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--mute)'}}>{label}</span>
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{
        padding: '10px 14px', border: '1px solid var(--line-strong)',
        borderRadius: 999, background: 'var(--cream)', fontFamily: 'var(--sans)', fontSize: 13,
        color: 'var(--forest-2)',
      }}>
      {options.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
    </select>
  </label>
);

const DetailRow = ({ l, v, color }) => (
  <div>
    <div style={{fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(245,239,224,0.55)'}}>{l}</div>
    <div style={{fontFamily:'var(--serif)', fontSize: 20, color: color || 'var(--cream)'}}>{v}</div>
  </div>
);

window.SizingTab = SizingTab;
window.ChemistryTab = ChemistryTab;
window.DispatchTab = DispatchTab;
window.ParetoTab = ParetoTab;
