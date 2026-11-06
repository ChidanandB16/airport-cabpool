import React, { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence, motion, animate, useMotionValue, useSpring, useTransform
} from 'framer-motion';
import { api } from './api.js';

const PLANE = 'https://images.unsplash.com/photo-1770705724072-1b784f1f2202?auto=format&fit=crop&w=1000&q=75';
const TAXI = 'https://images.unsplash.com/photo-1722302244557-0dfef3c52186?auto=format&fit=crop&w=800&q=70';
const TAXI_NIGHT = 'https://images.unsplash.com/photo-1674382301178-c30fb994e8d8?auto=format&fit=crop&w=900&q=60';

const ease = [0.16, 1, 0.3, 1];
const screen = {
  initial: { x: '55%', opacity: 0, scale: 1.04 },
  animate: { x: 0, opacity: 1, scale: 1, transition: { duration: 1.05, ease: [0.76, 0, 0.24, 1], staggerChildren: 0.09, delayChildren: 0.35 } },
  exit: { x: '-30%', opacity: 0, scale: 0.96, transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] } }
};
const item = { initial: { opacity: 0, y: 34, skewY: 2 }, animate: { opacity: 1, y: 0, skewY: 0, transition: { duration: 1, ease } } };

// ---------- background ----------
function Backdrop() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current, x = c.getContext('2d');
    let w, h, ps, raf;
    const size = () => {
      w = c.width = innerWidth; h = c.height = innerHeight;
      ps = Array.from({ length: 45 }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.5 + 0.3, v: Math.random() * 0.3 + 0.08, a: Math.random() * 6 }));
    };
    size(); addEventListener('resize', size);
    const loop = () => {
      x.clearRect(0, 0, w, h);
      const rgb = getComputedStyle(document.documentElement).getPropertyValue('--c2-rgb');
      ps.forEach(p => {
        p.y -= p.v; p.a += 0.02;
        if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
        x.fillStyle = `rgba(${rgb},${0.2 + 0.4 * Math.abs(Math.sin(p.a))})`;
        x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.3); x.fill();
      });
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', size); };
  }, []);
  return (
    <>
      <div className="mesh"><i /><i /><i /><i /></div>
      <canvas ref={ref} className="particles" />
    </>
  );
}

function Confetti({ burst }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!burst) return;
    const c = ref.current, x = c.getContext('2d');
    c.width = innerWidth; c.height = innerHeight;
    const st = getComputedStyle(document.documentElement);
    const cols = [`rgb(${st.getPropertyValue('--c1-rgb')})`, `rgb(${st.getPropertyValue('--c2-rgb')})`, '#34d399', '#fff'];
    const ps = Array.from({ length: 150 }, () => ({ x: innerWidth / 2, y: innerHeight * 0.4, vx: (Math.random() - 0.5) * 15, vy: -Math.random() * 15 - 4, s: 4 + Math.random() * 5, c: cols[(Math.random() * 4) | 0], r: Math.random() * 6 }));
    let t = 0, raf;
    const frame = () => {
      x.clearRect(0, 0, c.width, c.height);
      ps.forEach(p => { p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.r += 0.2; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); x.restore(); });
      if (++t < 130) raf = requestAnimationFrame(frame); else x.clearRect(0, 0, c.width, c.height);
    };
    frame();
    return () => cancelAnimationFrame(raf);
  }, [burst]);
  return <canvas ref={ref} className="confetti" />;
}

// ---------- small pieces ----------
function SplitText({ children, className = '', delay = 0 }) {
  return (
    <span className={className} aria-label={children}>
      {String(children).split(' ').map((w, i) => (
        <motion.span key={i} style={{ display: 'inline-block', marginRight: '.25em' }}
          initial={{ opacity: 0, y: '.6em', filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1, ease, delay: delay + i * 0.09 }}>{w}</motion.span>
      ))}
    </span>
  );
}

// Organic SVG waves/blobs (Haikei style), morphing slowly
function Waves() {
  const d1 = ['M0 120 C 90 60 180 160 270 110 S 390 70 390 70 V 200 H 0 Z', 'M0 90 C 90 150 180 60 270 120 S 390 130 390 130 V 200 H 0 Z'];
  const d2 = ['M0 150 C 110 100 200 170 290 130 S 390 110 390 110 V 200 H 0 Z', 'M0 130 C 110 170 200 110 290 150 S 390 160 390 160 V 200 H 0 Z'];
  return (
    <svg className="waves" viewBox="0 0 390 200" preserveAspectRatio="none" aria-hidden>
      <motion.path fill="rgba(var(--c1-rgb),.20)" animate={{ d: d1 }} transition={{ duration: 7, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }} />
      <motion.path fill="rgba(var(--c2-rgb),.12)" animate={{ d: d2 }} transition={{ duration: 9, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }} />
    </svg>
  );
}

function Counter({ to, suffix = '', delay = 0.5 }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const a = animate(0, to, { duration: 1.8, delay, ease: 'easeOut', onUpdate: n => setV(Math.round(n)) });
    return () => a.stop();
  }, [to, delay]);
  return <>{v}{suffix}</>;
}

function Steps({ n }) {
  return (
    <div className="steps">
      {[1, 2, 3].map(i => (
        <span key={i}><motion.i initial={{ scaleX: 0 }} animate={{ scaleX: i <= n ? 1 : 0 }} transition={{ duration: 0.9, ease }} /></span>
      ))}
    </div>
  );
}

function Btn({ children, variant = '', ...p }) {
  return (
    <motion.button className={'btn ' + variant} whileHover={{ y: -3, scale: 1.015 }} whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 400, damping: 22 }} {...p}>
      <span>{children}</span>
    </motion.button>
  );
}

function Field({ label, value, onChange, type = 'text', inputMode }) {
  const [f, setF] = useState(false);
  const up = f || value || type === 'date' || type === 'time';
  return (
    <motion.label className={'fl' + (f ? ' focus' : '')} variants={item}>
      <motion.span animate={{ y: up ? -17 : 0, scale: up ? 0.72 : 1, color: up ? 'var(--c2)' : 'var(--mut)' }} transition={{ duration: 0.35, ease }}>{label}</motion.span>
      <input type={type} inputMode={inputMode} value={value} onChange={e => onChange(e.target.value)} onFocus={() => setF(true)} onBlur={() => setF(false)} />
    </motion.label>
  );
}

function OtpBoxes({ value, onChange, shake }) {
  const refs = useRef([]);
  const set = (i, ch) => {
    const a = value.padEnd(6, ' ').split('');
    a[i] = ch || ' ';
    onChange(a.join('').trimEnd().replace(/ /g, ''));
    if (ch && refs.current[i + 1]) refs.current[i + 1].focus();
  };
  return (
    <motion.div className="otp" animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }} transition={{ duration: 0.5 }}
      onPaste={e => { const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6); if (t) { e.preventDefault(); onChange(t); } }}>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <motion.input key={i} ref={el => (refs.current[i] = el)} maxLength={1} inputMode="numeric" value={value[i] || ''}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.6, ease }}
          onChange={e => set(i, e.target.value.replace(/\D/g, ''))}
          onKeyDown={e => { if (e.key === 'Backspace' && !value[i] && refs.current[i - 1]) refs.current[i - 1].focus(); }} />
      ))}
    </motion.div>
  );
}

// ---------- screens ----------
function Welcome({ next }) {
  const mx = useMotionValue(0), my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 }), sy = useSpring(my, { stiffness: 60, damping: 18 });
  const rx = useTransform(sy, [-1, 1], [14, 2]), ry = useTransform(sx, [-1, 1], [-10, 10]);
  const px = useTransform(sx, [-1, 1], [18, -18]), py = useTransform(sy, [-1, 1], [12, -12]);
  useEffect(() => {
    const m = e => { mx.set((e.clientX / innerWidth) * 2 - 1); my.set((e.clientY / innerHeight) * 2 - 1); };
    const d = e => { if (e.gamma != null) { mx.set(Math.max(-1, Math.min(1, e.gamma / 30))); my.set(Math.max(-1, Math.min(1, (e.beta - 45) / 30))); } };
    addEventListener('pointermove', m); addEventListener('deviceorientation', d);
    return () => { removeEventListener('pointermove', m); removeEventListener('deviceorientation', d); };
  }, [mx, my]);
  return (
    <motion.section className="screen" {...screen}>
      <motion.div className="orb-wrap" variants={item} style={{ perspective: 900 }}>
        <motion.div className="orb" style={{ rotateX: rx, rotateY: ry }}>
          <motion.div className="orb-photo" style={{ backgroundImage: `linear-gradient(180deg,rgba(var(--bg-rgb),.25),rgba(var(--bg-rgb),.05) 45%,rgba(var(--bg-rgb),.85)),linear-gradient(120deg,rgba(var(--c1-rgb),.3),transparent 60%),url(${PLANE})`, x: px, y: py }} />
          <svg className="orb-routes" viewBox="0 0 320 300" aria-hidden>
            <defs><linearGradient id="rg" x1="0" x2="1"><stop offset="0" style={{ stopColor: 'var(--c1)' }} /><stop offset="1" style={{ stopColor: 'var(--c2)' }} /></linearGradient></defs>
            <path id="p1" d="M-10 230 C 80 60, 200 60, 330 200" fill="none" stroke="url(#rg)" strokeWidth="1.6" strokeDasharray="2 7" strokeLinecap="round" />
            <path id="p2" d="M-10 130 C 90 190, 210 190, 330 90" fill="none" stroke="url(#rg)" strokeWidth="1.2" strokeDasharray="2 8" strokeLinecap="round" opacity=".7" />
            <circle r="4" fill="#fff"><animateMotion dur="6s" repeatCount="indefinite"><mpath href="#p1" /></animateMotion></circle>
            <circle r="3" fill="var(--c2)"><animateMotion dur="7.5s" begin="1s" repeatCount="indefinite"><mpath href="#p2" /></animateMotion></circle>
          </svg>
        </motion.div>
      </motion.div>
      <h1><SplitText delay={0.2}>Land. Match.</SplitText><br /><span className="grad"><SplitText delay={0.6}>Share the cab.</SplitText></span></h1>
      <motion.p className="sub" variants={item}>Meet people landing near you and going your way. Split the fare. Connect only when everyone says yes.</motion.p>
      <motion.p className="flow" variants={item}>
        <b><Counter to={30} /></b> minute match window<br />
        <b><Counter to={2} /></b>-way consent before anyone connects<br />
        up to <b><Counter to={50} suffix="%" /></b> off the fare
      </motion.p>
      <motion.div variants={item}><Btn variant="big" onClick={next}>Get started &rarr;</Btn></motion.div>
    </motion.section>
  );
}

function PhoneStep({ phone, setPhone, onVerified }) {
  const [sent, setSent] = useState(false), [hint, setHint] = useState(''), [code, setCode] = useState(''), [err, setErr] = useState(''), [shake, setShake] = useState(0);
  const send = async () => {
    setErr('');
    try { const j = await api('otp/request', { phone }); setSent(true); setHint(j.devCode ? 'Demo mode: your OTP is ' + j.devCode : 'OTP sent.'); }
    catch (e) { setErr(e.message); }
  };
  const verify = async () => {
    setErr('');
    try { await api('otp/verify', { phone, code }); onVerified(); }
    catch { setErr('That OTP is not right. Try again.'); setShake(s => s + 1); }
  };
  return (
    <motion.section className="screen" {...screen}>
      <Steps n={1} />
      <motion.h2 variants={item}>Verify your <span className="grad">phone</span></motion.h2>
      <motion.p className="sub" variants={item}>Keeps the pool real. Your number is shared only after you both say yes.</motion.p>
      <motion.div className="card" variants={item}>
        <Field label="Phone number" value={phone} onChange={setPhone} inputMode="tel" />
        <Btn onClick={send}>Send OTP</Btn>
        <AnimatePresence>
          {sent && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.7, ease }} style={{ overflow: 'hidden' }}>
              <OtpBoxes value={code} onChange={setCode} shake={shake} key={shake} />
              <p className="hint">{hint}</p>
              <Btn onClick={verify}>Verify</Btn>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <p className="err">{err}</p>
    </motion.section>
  );
}

function TripStep({ phone, onJoined }) {
  const [f, setF] = useState({ name: '', flight: '', date: '', landing: '', destination: '' }), [err, setErr] = useState('');
  const set = k => v => setF(o => ({ ...o, [k]: v }));
  const go = async () => {
    setErr('');
    try { const r = await api('riders', { ...f, phone }); onJoined(r.id, f.landing); }
    catch (e) { setErr(e.message); }
  };
  return (
    <motion.section className="screen" {...screen}>
      <Steps n={2} />
      <motion.h2 variants={item}>Where are you <span className="grad">headed?</span></motion.h2>
      <motion.div className="card" variants={item}>
        <Field label="Your name" value={f.name} onChange={set('name')} />
        <Field label="Flight number (6E 204)" value={f.flight} onChange={set('flight')} />
        <Field label="Date" type="date" value={f.date} onChange={set('date')} />
        <Field label="Landing time" type="time" value={f.landing} onChange={set('landing')} />
        <Field label="Destination (Indiranagar)" value={f.destination} onChange={set('destination')} />
        <Btn onClick={go}>Find people going my way &rarr;</Btn>
      </motion.div>
      <p className="err">{err}</p>
    </motion.section>
  );
}

function Radar() {
  return (
    <motion.section className="screen center" {...screen}>
      <motion.div className="radar" variants={item}>
        {[0, 1, 2].map(i => <motion.span key={i} initial={{ scale: 0.2, opacity: 0.8 }} animate={{ scale: 1, opacity: 0 }} transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.9, ease: 'easeOut' }} />)}
        <motion.div className="sweep" animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} />
        {[[22, 72, 0], [70, 20, 0.9], [32, 14, 1.7]].map(([t, l, d], i) => <motion.b key={i} className="dot" style={{ top: t + '%', left: l + '%' }} animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1.5, 1.5, 0.6] }} transition={{ duration: 2.8, repeat: Infinity, delay: d }} />)}
        <i>&#9992;</i>
      </motion.div>
      <motion.h2 variants={item}>Scanning <span className="grad">arrivals</span></motion.h2>
      <motion.p className="sub" variants={item}>Same date, same destination, landing within 30 minutes.</motion.p>
    </motion.section>
  );
}

const mins = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

function Ring({ score }) {
  const c = 2 * Math.PI * 25;
  return (
    <svg viewBox="0 0 56 56" className="ring">
      <defs><linearGradient id="scoreg" x1="0" x2="1"><stop offset="0" style={{ stopColor: 'var(--c1)' }} /><stop offset="1" style={{ stopColor: 'var(--c2)' }} /></linearGradient></defs>
      <circle cx="28" cy="28" r="25" className="bgc" />
      <motion.circle cx="28" cy="28" r="25" className="fg" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - score / 100) }} transition={{ duration: 1.6, delay: 0.4, ease }} />
    </svg>
  );
}

function RiderCard({ m, myLanding, rid, reload, i }) {
  const r = m.rider, diff = Math.abs(mins(r.landing) - mins(myLanding)), score = Math.max(60, Math.round(100 - diff * 1.2));
  const answer = async accept => { await api(`riders/${rid}/respond`, { otherId: r.id, accept }); reload(); };
  return (
    <motion.div layout className={'rider' + (m.status === 'connected' ? ' connected' : '')}
      initial={{ opacity: 0, x: 70, rotateY: -10 }} animate={{ opacity: 1, x: 0, rotateY: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 1, ease, delay: 0.1 + i * 0.1 }} whileHover={{ y: -4 }}>
      <div className="strip" style={{ backgroundImage: `linear-gradient(rgba(var(--bg-rgb),.05),rgba(var(--bg-rgb),.9)),linear-gradient(120deg,rgba(var(--c1-rgb),.25),transparent 70%),url(${TAXI})` }} />
      <div className="rbody">
        <div className="head">
          <div className="av"><Ring score={score} /><div className="core">{r.name[0].toUpperCase()}</div></div>
          <div className="who"><b>{r.name}</b><small>Flight {r.flight}</small></div>
          <div className="score"><b><Counter to={score} suffix="%" delay={0.4} /></b><small>match</small></div>
        </div>
        <p className="meta">Lands {r.landing} &middot; {diff} min apart &middot; {r.destination} &middot; split the fare 2 ways</p>
        {m.status === 'pending' && (<>
          <p className="q">Comfortable travelling together?</p>
          <Btn variant="yes" onClick={() => answer(true)}>Yes, I am comfortable</Btn>
          <Btn variant="no" onClick={() => answer(false)}>No thanks</Btn>
        </>)}
        {m.status === 'waiting' && <span className="pill">You said yes. Waiting for them.</span>}
        {m.status === 'declined' && <span className="pill">Not travelling together</span>}
        {m.status === 'connected' && (
          <div className="conn"><span className="pill ok">Connected</span>
            <a className="phone" href={'tel:' + r.phone}>{r.phone}</a>
            <a className="wa" href={'https://wa.me/' + r.phone.replace(/\D/g, '')} target="_blank" rel="noreferrer">WhatsApp</a></div>
        )}
      </div>
    </motion.div>
  );
}

function Matches({ rid, myLanding, onBurst }) {
  const [matches, setMatches] = useState([]), seen = useRef(new Set());
  const load = async () => {
    const j = await api(`riders/${rid}/matches`);
    setMatches(j.matches);
    j.matches.forEach(m => { if (m.status === 'connected' && !seen.current.has(m.rider.id)) { seen.current.add(m.rider.id); onBurst(); } });
  };
  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, []);
  return (
    <motion.section className="screen" {...screen}>
      <Steps n={3} />
      <motion.h2 variants={item}>Your <span className="grad">crew</span></motion.h2>
      <motion.p className="sub" variants={item}>{matches.length ? `${matches.length} rider${matches.length > 1 ? 's' : ''} landing near you, same destination. Say yes to the ones you are comfortable with.` : 'No one yet. Stay on this page, we check every few seconds.'}</motion.p>
      <AnimatePresence>{matches.map((m, i) => <RiderCard key={m.rider.id} m={m} myLanding={myLanding} rid={rid} reload={load} i={i} />)}</AnimatePresence>
      <motion.div variants={item}><Btn variant="ghost" onClick={load}>Refresh</Btn></motion.div>
    </motion.section>
  );
}

// Curtain wipe between screens
function Curtain({ k }) {
  return (
    <motion.div key={k} className="curtain" initial={{ clipPath: 'inset(100% 0 0 0 round 40px)' }}
      animate={{ clipPath: ['inset(100% 0 0 0 round 40px)', 'inset(0% 0 0 0 round 0px)', 'inset(0 0 100% 0 round 40px)'] }}
      transition={{ duration: 1.25, times: [0, 0.45, 1], ease: [0.76, 0, 0.24, 1] }} />
  );
}

// ---------- app ----------
export default function App() {
  const [step, setStep] = useState('welcome'), [phone, setPhone] = useState(''), [rid, setRid] = useState(null), [myLanding, setLanding] = useState('00:00'), [burst, setBurst] = useState(0);
  const joined = (id, landing) => { setRid(id); setLanding(landing); setStep('radar'); setTimeout(() => setStep('matches'), 3000); };
  return (
    <>
      <Backdrop />
      <Waves />
      <div className="grain" />
      <motion.div className="radar-bg" animate={{ opacity: step === 'radar' ? 1 : 0 }} transition={{ duration: 1 }} style={{ backgroundImage: `linear-gradient(rgba(var(--bg-rgb),.75),rgba(var(--bg-rgb),.93)),url(${TAXI_NIGHT})` }} />
      <main className="app">
        <header><div className="logo"><span>&#9992;</span> Airport<em>CabPool</em></div><div className="live"><i />live pools</div></header>
        <Curtain k={step} />
        <AnimatePresence mode="wait">
          {step === 'welcome' && <Welcome key="w" next={() => setStep('phone')} />}
          {step === 'phone' && <PhoneStep key="p" phone={phone} setPhone={setPhone} onVerified={() => setStep('trip')} />}
          {step === 'trip' && <TripStep key="t" phone={phone} onJoined={joined} />}
          {step === 'radar' && <Radar key="r" />}
          {step === 'matches' && <Matches key="m" rid={rid} myLanding={myLanding} onBurst={() => setBurst(b => b + 1)} />}
        </AnimatePresence>
      </main>
      <Confetti burst={burst} />
    </>
  );
    }
