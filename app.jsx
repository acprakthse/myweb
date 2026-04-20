/* global React, ReactDOM, Hero, About, Simulation, Experience, Courses, Writings, Contact, CONTENT */

const { useState, useEffect } = React;

const App = () => {
  const [lang, setLang] = useState(() => localStorage.getItem('ac.lang') || 'en');
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => { localStorage.setItem('ac.lang', lang); }, [lang]);

  useEffect(() => {
    const ids = ['home', 'about', 'simulation', 'experience', 'courses', 'writings', 'contact'];
    const onScroll = () => {
      const y = window.scrollY + 120;
      let current = 'home';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= y) current = id;
      }
      setActiveSection(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const nav = CONTENT[lang].nav;
  const navItems = [
    ['about', nav.about],
    ['simulation', nav.sim],
    ['experience', nav.experience],
    ['courses', nav.courses],
    ['writings', nav.writings],
    ['contact', nav.contact],
  ];

  return (
    <>
      <nav className="nav">
        <a href="#home" className="nav-brand">
          <span>ardiancandra<span style={{ color: 'var(--terra)' }}>.com</span></span>
        </a>
        <div className="nav-links">
          {navItems.map(([id, label]) => (
            <a key={id} href={`#${id}`} className={activeSection === id ? 'active' : ''}>{label}</a>
          ))}
        </div>
        <div className="nav-right">
          <div className="lang-toggle">
            <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
            <button className={lang === 'id' ? 'active' : ''} onClick={() => setLang('id')}>ID</button>
          </div>
        </div>
      </nav>
      <Hero lang={lang} />
      <About lang={lang} />
      <Simulation lang={lang} />
      <Experience lang={lang} />
      <Courses lang={lang} />
      <Writings lang={lang} />
      <Contact lang={lang} />
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
