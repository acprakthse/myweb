/* global React, CONTENT, EXPERIENCE, COURSES, WRITINGS, HandDrawnScene,
   SizingTab, ChemistryTab, DispatchTab, ParetoTab */

const { useState, useEffect } = React;

/* ============== HERO ============== */
const Hero = ({ lang }) => {
  const t = CONTENT[lang].hero;
  return (
    <>
      {/* FULL-SCREEN animated landing (no text) */}
      <section id="home" className="paper-dots"
        style={{ padding: 0, position: 'relative', minHeight: 'calc(100vh - 72px)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        data-screen-label="Hero">
        <div style={{ width: '100%', height: '100%' }}>
          <HandDrawnScene />
        </div>
        {/* scroll hint */}
        <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink)', opacity: 0.7 }}>
          ↓ scroll
        </div>
      </section>

      {/* INTRO text moved to second scroll */}
      <section id="intro" data-screen-label="Intro" style={{ padding: '100px 40px', background: 'var(--cream)' }}>
        <div className="container-narrow">
          <div className="mono" style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--terra)', marginBottom: 22 }}>
            <span style={{ color: 'var(--forest-2)' }}>ardiancandra.com</span> &nbsp;·&nbsp; {t.tagline}
          </div>
          <h1 style={{ whiteSpace: 'pre-line', marginBottom: 28 }}>{t.name}</h1>
          <p style={{ fontSize: 18, lineHeight: 1.65, marginBottom: 32, color: 'var(--forest-2)', maxWidth: 720 }}>
            {t.subtitle}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="#simulation" className="btn">→ {t.ctaPrimary}</a>
            <a href="#experience" className="btn btn-ghost">{t.ctaGhost}</a>
          </div>
        </div>
      </section>
    </>
  );
};

/* ============== ABOUT ============== */
const About = ({ lang }) => {
  const t = CONTENT[lang].about;
  return (
    <section id="about" data-screen-label="About" style={{ paddingTop: 60 }}>
      <div className="container">
        <div className="section-tag">{t.tag}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 60, alignItems: 'flex-start' }} className="about-grid">
          <div>
            <div style={{
              width: '100%', aspectRatio: '1/1', borderRadius: 14,
              overflow: 'hidden', border: '1px solid var(--line-strong)',
              backgroundImage: 'url(assets/ardian.jpg)',
              backgroundSize: 'cover', backgroundPosition: 'center top',
            }} />
            <div style={{ marginTop: 20, fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--mute)', lineHeight: 1.8 }}>
              <div>📍 Stockholm, Sweden</div>
              <div>✉ <a href="mailto:hallo@ardiancandra.com">hallo@ardiancandra.com</a></div>
              <div>in/ <a href="https://www.linkedin.com/in/ardiancandrapratama/" target="_blank" rel="noopener">ardiancandrapratama</a></div>
              <div>gh/ <a href="https://github.com/acprakthse" target="_blank" rel="noopener">acprakthse</a></div>
            </div>
          </div>
          <div>
            <h2 style={{ marginBottom: 28, maxWidth: 720 }}>{t.title}</h2>
            {t.body.map((p, i) => (
              <p key={i} style={{ fontSize: 16.5, lineHeight: 1.7, marginBottom: 18, maxWidth: 720 }}>{p}</p>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginTop: 36 }} className="facts-grid">
              {t.facts.map(([v, l], i) => (
                <div key={i} className="metric" style={{ borderLeftColor: 'var(--terra)' }}>
                  <div className="metric-value" style={{ fontSize: 30 }}>{v}</div>
                  <div className="metric-label" style={{ marginTop: 6 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .about-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .facts-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </section>
  );
};

/* ============== SIMULATION SECTION ============== */
const Simulation = ({ lang }) => {
  const t = CONTENT[lang].sim;
  const [tab, setTab] = useState(0);
  const Tabs = [SizingTab, ChemistryTab, DispatchTab, ParetoTab];
  const Active = Tabs[tab];
  return (
    <section id="simulation" data-screen-label="Thesis Simulation"
      style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      <div className="container">
        <div className="section-tag">{t.tag}</div>
        <h2 style={{ marginBottom: 12, maxWidth: 860 }}>{t.title}</h2>
        <p className="muted" style={{ fontSize: 16, maxWidth: 680, marginBottom: 40 }}>{t.subtitle}</p>

        <div className="sim-tabs">
          {t.tabs.map((label, i) => (
            <button key={i} className={'sim-tab' + (i === tab ? ' active' : '')} onClick={() => setTab(i)}>
              <span className="num">{String(i + 1).padStart(2, '0')}</span>
              {label}
            </button>
          ))}
        </div>

        <div style={{ background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 14, padding: '36px 32px' }}>
          <Active lang={lang} />
        </div>
      </div>
    </section>
  );
};

/* ============== EXPERIENCE ============== */
const Experience = ({ lang }) => {
  const t = CONTENT[lang].experience;
  return (
    <section id="experience" data-screen-label="Experience">
      <div className="container">
        <div className="section-tag">{t.tag}</div>
        <h2 style={{ marginBottom: 48 }}>{t.title}</h2>
        <div>
          {EXPERIENCE.map((e, i) => (
            <div key={i} className="exp-item">
              <div>
                <div className="exp-date">{e.period}</div>
                <div className="exp-date" style={{ marginTop: 4, color: 'var(--mute)' }}>{e.location}</div>
              </div>
              <div>
                <div className="exp-role">{e.role}</div>
                <div className="exp-org">{e.org}</div>
                <ul className="exp-bullets">
                  {e.bullets[lang].map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ============== COURSES ============== */
const Courses = ({ lang }) => {
  const t = CONTENT[lang].courses;
  return (
    <section id="courses" data-screen-label="Courses"
      style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      <div className="container">
        <div className="section-tag">{t.tag}</div>
        <h2 style={{ marginBottom: 48, maxWidth: 720 }}>{t.title}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }} className="course-grid">
          {COURSES.map((c, i) => (
            <div key={i} className="card" style={{ background: 'var(--cream)' }}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--terra)', marginBottom: 10, textTransform: 'uppercase' }}>
                KTH · Project {String(i + 1).padStart(2, '0')}
              </div>
              <h3 style={{ fontSize: 22, marginBottom: 12, lineHeight: 1.2 }}>{c.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.55, margin: '0 0 16px', color: 'var(--forest-2)' }}>{c.desc[lang]}</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {c.tags.map((tag, j) => <span key={j} className="pill">{tag}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) { .course-grid { grid-template-columns: 1fr !important; } }
        @media (min-width: 901px) and (max-width: 1200px) { .course-grid { grid-template-columns: 1fr 1fr !important; } }
      `}</style>
    </section>
  );
};

/* ============== WRITINGS ============== */
const Writings = ({ lang }) => {
  const t = CONTENT[lang].writings;
  return (
    <section id="writings" data-screen-label="Writings">
      <div className="container">
        <div className="section-tag">{t.tag}</div>
        <h2 style={{ marginBottom: 48, maxWidth: 720 }}>{t.title}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }} className="writing-grid">
          {WRITINGS.map((w, i) => (
            <div key={i} className={'writing-card' + (w.kind === 'featured' ? ' featured' : '')}
              style={w.kind === 'featured' ? { gridColumn: 'span 2' } : {}}>
              {w.kind === 'featured' && <WritingFeatureVisual />}
              {w.kind === 'impact' && <WritingImpactVisual />}
              {w.kind === 'research' && <WritingResearchVisual i={i} />}
              <div className="writing-body">
                <div className="writing-meta">
                  <span>{w.kicker}</span>
                  <span style={{
                    padding: '3px 9px',
                    borderRadius: 999,
                    border: '1px solid ' + (w.kind === 'featured' ? 'rgba(116,198,157,0.5)' : 'var(--line-strong)'),
                    color: w.kind === 'featured' ? 'var(--sage-2)' : 'var(--forest)',
                  }}>{w.status}</span>
                </div>
                <h3 style={{ fontSize: w.kind === 'featured' ? 34 : 22, marginBottom: 10, lineHeight: 1.15 }}>{w.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.55, margin: '0 0 14px' }}>{w.body[lang]}</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {w.tags.map((tag, j) => <span key={j} className="pill">{tag}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 800px) {
          .writing-grid { grid-template-columns: 1fr !important; }
          .writing-card.featured { grid-column: span 1 !important; }
        }
      `}</style>
    </section>
  );
};

/* visuals for writing cards — minimal, on-theme, no AI slop */
const WritingFeatureVisual = () => (
  <div className="writing-visual" style={{ height: 260, background: 'var(--forest-2)', borderBottom: 0 }}>
    <svg viewBox="0 0 800 260" style={{ width: '100%', height: '100%' }}>
      {/* NSGA pareto mini */}
      <g stroke="rgba(116,198,157,0.4)" strokeWidth="1">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <line key={i} x1={80 + i * 120} y1="30" x2={80 + i * 120} y2="220" />
        ))}
        {[0, 1, 2, 3].map(i => (
          <line key={i} x1="60" y1={40 + i * 50} x2="760" y2={40 + i * 50} />
        ))}
      </g>
      {[
        [140, 90, 18], [230, 70, 14], [310, 110, 11], [390, 80, 22],
        [470, 140, 9], [550, 60, 28], [620, 120, 16], [680, 170, 12],
      ].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r}
          fill={i === 1 ? 'rgba(244,162,97,0.6)' : 'rgba(116,198,157,0.35)'}
          stroke={i === 1 ? 'var(--ochre)' : 'var(--sage-2)'}
          strokeWidth="1.8" />
      ))}
      <text x="40" y="250" style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: 'rgba(251,251,247,0.5)', letterSpacing: '0.1em' }}>
        CAPEX →
      </text>
      <text x="40" y="40" textAnchor="end" transform="rotate(-90 40 40)"
        style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: 'rgba(251,251,247,0.5)', letterSpacing: '0.1em' }}>
        ← NPV
      </text>
    </svg>
  </div>
);

const WritingImpactVisual = () => (
  <div className="writing-visual">
    <svg viewBox="0 0 400 180" style={{ width: '100%', height: '100%' }}>
      {/* submarine cable illustration */}
      <path className="ink" d="M 0 120 Q 100 110 180 130 T 400 120" fill="none" strokeWidth="2" />
      <path className="ink-thin" d="M 0 130 Q 100 120 180 140 T 400 130" fill="none" />
      <path d="M 0 180 L 0 140 Q 100 130 180 150 T 400 140 L 400 180 Z" fill="rgba(38,70,83,0.15)" />
      <circle cx="60" cy="80" r="20" fill="rgba(82,183,136,0.2)" stroke="var(--ink)" strokeWidth="2" />
      <text x="60" y="85" textAnchor="middle" style={{ fontFamily: 'Instrument Serif', fontSize: 12, fill: 'var(--ink)' }}>Batam</text>
      <circle cx="340" cy="80" r="20" fill="rgba(82,183,136,0.2)" stroke="var(--ink)" strokeWidth="2" />
      <text x="340" y="85" textAnchor="middle" style={{ fontFamily: 'Instrument Serif', fontSize: 12, fill: 'var(--ink)' }}>Sambu</text>
      <path className="ink" d="M 80 82 Q 200 50 320 82" strokeDasharray="4 4" fill="none" />
    </svg>
  </div>
);

const WritingResearchVisual = ({ i }) => {
  const hues = ['#52B788', '#F4A261', '#264653', '#C44536'];
  const c = hues[i % hues.length];
  return (
    <div className="writing-visual">
      <svg viewBox="0 0 400 180" style={{ width: '100%', height: '100%' }}>
        <rect width="400" height="180" fill="var(--paper)" />
        {/* abstract composition */}
        <circle cx="120" cy="90" r="60" fill={c} opacity="0.25" />
        <rect x="180" y="50" width="140" height="80" fill={c} opacity="0.15"
          stroke={c} strokeWidth="2" />
        {[0, 1, 2, 3, 4].map(j => (
          <line key={j} x1={190 + j * 25} y1="60" x2={190 + j * 25} y2="120"
            stroke="var(--ink)" strokeWidth="1" opacity="0.35" />
        ))}
      </svg>
    </div>
  );
};

/* ============== FOOTER / CONTACT ============== */
const Contact = ({ lang }) => {
  const t = CONTENT[lang].contact;
  return (
    <section id="contact" data-screen-label="Contact"
      style={{ background: 'var(--forest-2)', color: 'var(--cream)' }}>
      <div className="container">
        <div className="section-tag" style={{ color: 'var(--sage-2)' }}>
          <span style={{ color: 'var(--sage-2)' }}>§</span> {t.tag}
        </div>
        <h2 style={{ color: 'var(--cream)', marginBottom: 24, maxWidth: 720 }}>{t.title}</h2>
        <p style={{ fontSize: 17, maxWidth: 640, color: 'rgba(251,251,247,0.75)', marginBottom: 36 }}>{t.body}</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 48 }}>
          <a href="mailto:hallo@ardiancandra.com" className="btn" style={{ background: 'var(--cream)', color: 'var(--forest-2)', borderColor: 'var(--cream)' }}>✉ hallo@ardiancandra.com</a>
          <a href="https://www.linkedin.com/in/ardiancandrapratama/" target="_blank" rel="noopener" className="btn btn-ghost" style={{ borderColor: 'var(--cream)', color: 'var(--cream)' }}>LinkedIn</a>
          <a href="https://github.com/acprakthse" target="_blank" rel="noopener" className="btn btn-ghost" style={{ borderColor: 'var(--cream)', color: 'var(--cream)' }}>GitHub</a>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 32, borderTop: '1px solid rgba(251,251,247,0.15)', flexWrap: 'wrap', gap: 16, fontFamily: 'var(--mono)', fontSize: 11, color: 'rgba(251,251,247,0.5)', letterSpacing: '0.08em' }}>
          <div>© 2026 Ardian Candra Pratama · ardiancandra.com</div>
          <div>Built with React · Hand-drawn with care in Stockholm</div>
        </div>
      </div>
    </section>
  );
};

window.Hero = Hero;
window.About = About;
window.Simulation = Simulation;
window.Experience = Experience;
window.Courses = Courses;
window.Writings = Writings;
window.Contact = Contact;
