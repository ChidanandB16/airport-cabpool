import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, animate } from 'framer-motion';
import { api } from './api.js';

const ease = [0.16, 1, 0.3, 1];
const screen = {
  initial: { x: '60%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.9, ease: [0.76, 0, 0.24, 1], staggerChildren: 0.08, delayChildren: 0.25 } },
  exit: { x: '-35%', opacity: 0, transition: { duration: 0.55, ease: [0.76, 0, 0.24, 1] } }
};
const item = { initial: { opacity: 0, y: 22 }, animate: { opacity: 1, y: 0, transition: { duration: 0.9, ease } } };

// ---------- line art ----------
// Thin line-art airliner + animated route, single orange accent.
function LineJet() {
  return (
    <svg className="linejet" viewBox="0 0 390 240" fill="none" aria-hidden>
      {/* route */}
      <motion.path d="M18 208 C 120 150, 235 120, 372 96" stroke="#161616" strokeWidth="1" strokeDasharray="2 7" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.4, ease: 'easeInOut', delay: 0.7 }} opacity=".55" />
      {/* origin tick */}
      <motion.circle cx="18" cy="208" r="3" stroke="#161616" strokeWidth="1" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7, duration: 0.5, ease }} />
      {/* destination: the one orange dot */}
      <motion.circle cx="372" cy="96" r="4.5" fill="#F24E1E" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2.8, duration: 0.5, type: 'spring', stiffness: 300, damping: 14 }} />
      <motion.circle cx="372" cy="96" r="4.5" stroke="#F24E1E" strokeWidth="1" fill="none"
        initial={{ scale: 1, opacity: 0 }} animate={{ scale: [1, 2.4], opacity: [0.7, 0] }} transition={{ delay: 3, duration: 2.2, repeat: Infinity, ease: 'easeOut' }} />
      {/* jet, drawn on, floating gently */}
      <motion.g initial={{ y: 8 }} animate={{ y: [8, -6, 8] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}>
        <motion.g stroke="#161616" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 1.4 }}>
          {/* fuselage */}
          <path d="M96 128 q14 -12 44 -17 l84 -13 q26 -4 36 1 q5 3 -1 6 l-34 8 q-70 14 -102 15 q-20 1 -27 0 z" />
          {/* wing */}
          <path d="M150 111 l34 -26 l12 0 l-24 27" />
          <path d="M158 117 l26 16 l-10 1 l-22 -13" />
          {/* tail */}
          <path d="M232 99 l12 -19 l8 0 l-6 21" />
          {/* engine */}
          <path d="M172 121 q8 -3 12 0 q-2 5 -10 5 q-4 -1 -2 -5 z" />
          {/* windows */}
          <path d="M118 122 l6 -1 M132 120 l6 -1 M146 118 l6 -1 M160 116 l6 -1" strokeWidth="1" />
        </motion.g>
      </motion.g>
    </svg>
  );
}

// ---------- small pieces ----------
function SplitText({ children, className = '', delay = 0 }) {
  return (
    <span className={className} aria-label={children}>
      {String(children).split(' ').map((w, i) => (
        <motion.span key={i} style={{ display: 'inline-block', marginRight: '.22em' }}
          initial={{ opacity: 0, y: '.5em' }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: delay + i * 0.07 }}>{w}</motion.span>
      ))}
    </span>
  );
}

function Steps({ n }) {
  return (
    <div className="steps">
      {[1, 2, 3].map(i => (
        <span key={i}><motion.i initial={{ scaleX: 0 }} animate={{ scaleX: i <= n ? 1 : 0 }} transition={{ duration: 0.8, ease }} /></span>
      ))}
    </div>
  );
}

function Btn({ children, variant = '', ...p }) {
  return (
    <motion.button className={'btn ' + variant} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 22 }} {...p}>
      <span>{children}</span>
    </motion.button>
  );
}

function Field({ label, value, onChange, type = 'text', inputMode }) {
  const [f, setF] = useState(false);
  const up = f || value || type === 'date' || type === 'time';
  return (
    <motion.label className={'fl' + (f ? ' focus' : '')} variants={item}>
      <motion.span animate={{ y: up ? -14 : 0, scale: up ? 0.74 : 1, color: up ? '#F24E1E' : '#8a867d' }} transition={{ duration: 0.3, ease }}>{label}</motion.span>
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
    <motion.div className="otp" animate={shake ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }} transition={{ duration: 0.45 }}
      onPaste={e => { const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6); if (t) { e.preventDefault(); onChange(t); } }}>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <motion.input key={i} ref={el => (refs.current[i] = el)} maxLength={1} inputMode="numeric" value={value[i] || ''}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.5, ease }}
          onChange={e => set(i, e.target.value.replace(/\D/g, ''))}
          onKeyDown={e => { if (e.key === 'Backspace' && !value[i] && refs.current[i - 1]) refs.current[i - 1].focus(); }} />
      ))}
    </motion.div>
  );
}

function Logo() {
  return <div className="logo">CabPool<i /></div>;
}

// ---------- screens ----------
function Welcome({ next }) {
  return (
    <motion.section className="screen hero" {...screen}>
      <motion.p className="eyebrow" variants={item}><b />Airport cab pooling</motion.p>
      <h1 className="hero-title">
        <SplitText delay={0.15}>Land. Match.</SplitText><br />
        <span className="accent-serif"><SplitText delay={0.5}>Ride together.</SplitText></span>
      </h1>
      <motion.div className="hero-stage" variants={item}><LineJet /></motion.div>
      <motion.p className="sub" variants={item}>One cab from the airport, split fairly with people landing next to you.</motion.p>
      <motion.div className="cta-row" variants={item}>
        <Btn onClick={next}>Get started &rarr;</Btn>
      </motion.div>
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
      <motion.h2 variants={item}>Verify your phone</motion.h2>
      <motion.p className="sub" variants={item}>Your number is shared only after you both say yes.</motion.p>
      <motion.div className="card" variants={item}>
        <Field label="Phone number" value={phone} onChange={setPhone} inputMode="tel" />
        <Btn onClick={send}>Send OTP</Btn>
        <AnimatePresence>
          {sent && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.6, ease }} style={{ overflow: 'hidden' }}>
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
      <motion.h2 variants={item}>Where are you headed?</motion.h2>
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
        {[0, 1, 2].map(i => <motion.span key={i} initial={{ scale: 0.25, opacity: 0.6 }} animate={{ scale: 1, opacity: 0 }} transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.9, ease: 'easeOut' }} />)}
        {[[24, 70, 0], [68, 24, 0.9], [36, 16, 1.7]].map(([t, l, d], i) => <motion.b key={i} className="dot" style={{ top: t + '%', left: l + '%' }} animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1.3, 1.3, 0.6] }} transition={{ duration: 2.8, repeat: Infinity, delay: d }} />)}
        <i>&#9992;</i>
      </motion.div>
      <motion.h2 variants={item}>Scanning arrivals</motion.h2>
      <motion.p className="sub" variants={item}>Same date, same destination, landing within 30 minutes.</motion.p>
    </motion.section>
  );
}

const mins = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

function Ring({ score }) {
  const c = 2 * Math.PI * 25;
  return (
    <svg viewBox="0 0 56 56" className="ring">
      <circle cx="28" cy="28" r="25" className="bgc" />
      <motion.circle cx="28" cy="28" r="25" className="fg" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - score / 100) }} transition={{ duration: 1.5, delay: 0.3, ease }} />
    </svg>
  );
}

function RiderCard({ m, myLanding, rid, reload, i }) {
  const r = m.rider, diff = Math.abs(mins(r.landing) - mins(myLanding)), score = Math.max(60, Math.round(100 - diff * 1.2));
  const answer = async accept => { await api(`riders/${rid}/respond`, { otherId: r.id, accept }); reload(); };
  return (
    <motion.div layout className={'rider' + (m.status === 'connected' ? ' connected' : '')}
      initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.8, ease, delay: 0.1 + i * 0.1 }}>
      <div className="head">
        <div className="av"><Ring score={score} /><div className="core">{r.name[0].toUpperCase()}</div></div>
        <div className="who"><b>{r.name}</b><small>Flight {r.flight}</small></div>
        <div className="score"><b>{score}%</b><small>match</small></div>
      </div>
      <p className="meta">Lands {r.landing} &middot; {diff} min apart &middot; {r.destination}</p>
      {m.status === 'pending' && (<>
        <p className="q">Comfortable travelling together?</p>
        <Btn variant="yes" onClick={() => answer(true)}>Yes, I am comfortable</Btn>
        <Btn variant="no" onClick={() => answer(false)}>No thanks</Btn>
      </>)}
      {m.status === 'waiting' && <span className="pill">You said yes. Waiting for them.</span>}
      {m.status === 'declined' && <span className="pill">Not travelling together</span>}
      {m.status === 'connected' && (
        <div className="conn"><span className="pill ok"><i />Connected</span>
          <a className="phone" href={'tel:' + r.phone}>{r.phone}</a>
          <a className="wa" href={'https://wa.me/' + r.phone.replace(/\D/g, '')} target="_blank" rel="noreferrer">WhatsApp</a></div>
      )}
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
      <motion.h2 variants={item}>Your crew</motion.h2>
      <motion.p className="sub" variants={item}>{matches.length ? `${matches.length} rider${matches.length > 1 ? 's' : ''} landing near you, same destination.` : 'No one yet. Stay on this page, we check every few seconds.'}</motion.p>
      <AnimatePresence>{matches.map((m, i) => <RiderCard key={m.rider.id} m={m} myLanding={myLanding} rid={rid} reload={load} i={i} />)}</AnimatePresence>
      <motion.div variants={item}><Btn variant="ghost" onClick={load}>Refresh</Btn></motion.div>
    </motion.section>
  );
}

function Burst({ burst }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!burst) return;
    const c = ref.current, x = c.getContext('2d');
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { api } from './api.js';

const HERO_PHOTO = 'https://images.unsplash.com/photo-1770705724072-1b784f1f2202?auto=format&fit=crop&w=1400&q=70';

const ease = [0.16, 1, 0.3, 1];
const screen = {
  initial: { x: '60%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.9, ease: [0.76, 0, 0.24, 1], staggerChildren: 0.08, delayChildren: 0.25 } },
  exit: { x: '-35%', opacity: 0, transition: { duration: 0.55, ease: [0.76, 0, 0.24, 1] } }
};
const item = { initial: { opacity: 0, y: 22 }, animate: { opacity: 1, y: 0, transition: { duration: 0.9, ease } } };

// ---------- line art ----------
// Thin line-art airliner + animated route, single orange accent.
function LineRoute() {
  return (
    <svg className="linejet" viewBox="0 0 390 240" fill="none" aria-hidden>
      <motion.path d="M18 208 C 120 150, 235 120, 372 96" stroke="#161616" strokeWidth="1" strokeDasharray="2 7" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.4, ease: 'easeInOut', delay: 0.7 }} opacity=".7" />
      <motion.circle cx="18" cy="208" r="3" stroke="#161616" strokeWidth="1" fill="none" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7, duration: 0.5, ease }} />
      <motion.circle cx="372" cy="96" r="4.5" fill="#F24E1E" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2.8, duration: 0.5, type: 'spring', stiffness: 300, damping: 14 }} />
      <motion.circle cx="372" cy="96" r="4.5" stroke="#F24E1E" strokeWidth="1" fill="none"
        initial={{ scale: 1, opacity: 0 }} animate={{ scale: [1, 2.4], opacity: [0.7, 0] }} transition={{ delay: 3, duration: 2.2, repeat: Infinity, ease: 'easeOut' }} />
    </svg>
  );
}

// ---------- small pieces ----------
function SplitText({ children, className = '', delay = 0 }) {
  return (
    <span className={className} aria-label={children}>
      {String(children).split(' ').map((w, i) => (
        <motion.span key={i} style={{ display: 'inline-block', marginRight: '.22em' }}
          initial={{ opacity: 0, y: '.5em' }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: delay + i * 0.07 }}>{w}</motion.span>
      ))}
    </span>
  );
}

function Steps({ n }) {
  return (
    <div className="steps">
      {[1, 2, 3].map(i => (
        <span key={i}><motion.i initial={{ scaleX: 0 }} animate={{ scaleX: i <= n ? 1 : 0 }} transition={{ duration: 0.8, ease }} /></span>
      ))}
    </div>
  );
}

function Btn({ children, variant = '', ...p }) {
  return (
    <motion.button className={'btn ' + variant} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 22 }} {...p}>
      <span>{children}</span>
    </motion.button>
  );
}

function Field({ label, value, onChange, type = 'text', inputMode }) {
  const [f, setF] = useState(false);
  const up = f || value || type === 'date' || type === 'time';
  return (
    <motion.label className={'fl' + (f ? ' focus' : '')} variants={item}>
      <motion.span animate={{ y: up ? -14 : 0, scale: up ? 0.74 : 1, color: up ? '#F24E1E' : '#8a867d' }} transition={{ duration: 0.3, ease }}>{label}</motion.span>
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
    <motion.div className="otp" animate={shake ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }} transition={{ duration: 0.45 }}
      onPaste={e => { const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6); if (t) { e.preventDefault(); onChange(t); } }}>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <motion.input key={i} ref={el => (refs.current[i] = el)} maxLength={1} inputMode="numeric" value={value[i] || ''}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.5, ease }}
          onChange={e => set(i, e.target.value.replace(/\D/g, ''))}
          onKeyDown={e => { if (e.key === 'Backspace' && !value[i] && refs.current[i - 1]) refs.current[i - 1].focus(); }} />
      ))}
    </motion.div>
  );
}

function Logo() {
  return <div className="logo">CabPool<i /></div>;
}

// ---------- screens ----------
function Welcome({ next }) {
  const mx = useMotionValue(0), my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 55, damping: 18 }), sy = useSpring(my, { stiffness: 55, damping: 18 });
  const bx = useTransform(sx, [-1, 1], [12, -12]), by = useTransform(sy, [-1, 1], [8, -8]);
  useEffect(() => {
    const m = e => { mx.set((e.clientX / innerWidth) * 2 - 1); my.set((e.clientY / innerHeight) * 2 - 1); };
    const d = e => { if (e.gamma != null) { mx.set(Math.max(-1, Math.min(1, e.gamma / 30))); my.set(Math.max(-1, Math.min(1, (e.beta - 45) / 30))); } };
    addEventListener('pointermove', m); addEventListener('deviceorientation', d);
    return () => { removeEventListener('pointermove', m); removeEventListener('deviceorientation', d); };
  }, [mx, my]);
  return (
    <motion.section className="screen hero" {...screen}>
      <motion.div className="hero-bg" style={{ x: bx, y: by, backgroundImage: `linear-gradient(180deg, rgba(238,237,233,.6), rgba(238,237,233,.1) 34%, rgba(238,237,233,.06) 58%, rgba(238,237,233,.96) 92%), url(${HERO_PHOTO})` }} />
      <motion.p className="eyebrow" variants={item}><b />Airport cab pooling</motion.p>
      <h1 className="hero-title">
        <SplitText delay={0.15}>Land. Match.</SplitText><br />
        <span className="accent-serif"><SplitText delay={0.5}>Ride together.</SplitText></span>
      </h1>
      <motion.div className="hero-stage" variants={item}><LineRoute /></motion.div>
      <motion.p className="sub" variants={item}>One cab from the airport, split fairly with people landing next to you.</motion.p>
      <motion.div className="cta-row" variants={item}>
        <Btn onClick={next}>Get started &rarr;</Btn>
      </motion.div>
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
      <motion.h2 variants={item}>Verify your phone</motion.h2>
      <motion.p className="sub" variants={item}>Your number is shared only after you both say yes.</motion.p>
      <motion.div className="card" variants={item}>
        <Field label="Phone number" value={phone} onChange={setPhone} inputMode="tel" />
        <Btn onClick={send}>Send OTP</Btn>
        <AnimatePresence>
          {sent && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.6, ease }} style={{ overflow: 'hidden' }}>
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
      <motion.h2 variants={item}>Where are you headed?</motion.h2>
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
        {[0, 1, 2].map(i => <motion.span key={i} initial={{ scale: 0.25, opacity: 0.6 }} animate={{ scale: 1, opacity: 0 }} transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.9, ease: 'easeOut' }} />)}
        {[[24, 70, 0], [68, 24, 0.9], [36, 16, 1.7]].map(([t, l, d], i) => <motion.b key={i} className="dot" style={{ top: t + '%', left: l + '%' }} animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1.3, 1.3, 0.6] }} transition={{ duration: 2.8, repeat: Infinity, delay: d }} />)}
        <i>&#9992;</i>
      </motion.div>
      <motion.h2 variants={item}>Scanning arrivals</motion.h2>
      <motion.p className="sub" variants={item}>Same date, same destination, landing within 30 minutes.</motion.p>
    </motion.section>
  );
}

const mins = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

function Ring({ score }) {
  const c = 2 * Math.PI * 25;
  return (
    <svg viewBox="0 0 56 56" className="ring">
      <circle cx="28" cy="28" r="25" className="bgc" />
      <motion.circle cx="28" cy="28" r="25" className="fg" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - score / 100) }} transition={{ duration: 1.5, delay: 0.3, ease }} />
    </svg>
  );
}

function RiderCard({ m, myLanding, rid, reload, i }) {
  const r = m.rider, diff = Math.abs(mins(r.landing) - mins(myLanding)), score = Math.max(60, Math.round(100 - diff * 1.2));
  const answer = async accept => { await api(`riders/${rid}/respond`, { otherId: r.id, accept }); reload(); };
  return (
    <motion.div layout className={'rider' + (m.status === 'connected' ? ' connected' : '')}
      initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.8, ease, delay: 0.1 + i * 0.1 }}>
      <div className="head">
        <div className="av"><Ring score={score} /><div className="core">{r.name[0].toUpperCase()}</div></div>
        <div className="who"><b>{r.name}</b><small>Flight {r.flight}</small></div>
        <div className="score"><b>{score}%</b><small>match</small></div>
      </div>
      <p className="meta">Lands {r.landing} &middot; {diff} min apart &middot; {r.destination}</p>
      {m.status === 'pending' && (<>
        <p className="q">Comfortable travelling together?</p>
        <Btn variant="yes" onClick={() => answer(true)}>Yes, I am comfortable</Btn>
        <Btn variant="no" onClick={() => answer(false)}>No thanks</Btn>
      </>)}
      {m.status === 'waiting' && <span className="pill">You said yes. Waiting for them.</span>}
      {m.status === 'declined' && <span className="pill">Not travelling together</span>}
      {m.status === 'connected' && (
        <div className="conn"><span className="pill ok"><i />Connected</span>
          <a className="phone" href={'tel:' + r.phone}>{r.phone}</a>
          <a className="wa" href={'https://wa.me/' + r.phone.replace(/\D/g, '')} target="_blank" rel="noreferrer">WhatsApp</a></div>
      )}
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
      <motion.h2 variants={item}>Your crew</motion.h2>
      <motion.p className="sub" variants={item}>{matches.length ? `${matches.length} rider${matches.length > 1 ? 's' : ''} landing near you, same destination.` : 'No one yet. Stay on this page, we check every few seconds.'}</motion.p>
      <AnimatePresence>{matches.map((m, i) => <RiderCard key={m.rider.id} m={m} myLanding={myLanding} rid={rid} reload={load} i={i} />)}</AnimatePresence>
      <motion.div variants={item}><Btn variant="ghost" onClick={load}>Refresh</Btn></motion.div>
    </motion.section>
  );
}

function Burst({ burst }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!burst) return;
    const c = ref.current, x = c.getContext('2d');
    c.width = innerWidth; c.height = innerHeight;
    const ps = Array.from({ length: 46 }, (_, i) => ({ x: innerWidth / 2, y: innerHeight * 0.42, a: (i / 46) * Math.PI * 2, v: 3 + Math.random() * 5, l: 0, c: i % 3 ? '#161616' : '#F24E1E' }));
    let t = 0, raf;
    const frame = () => {
      x.clearRect(0, 0, c.width, c.height);
      ps.forEach(p => {
        p.l += 1; const d = p.v * p.l * 0.9;
        const px = p.x + Math.cos(p.a) * d, py = p.y + Math.sin(p.a) * d + p.l * p.l * 0.02;
        x.globalAlpha = Math.max(0, 1 - p.l / 60);
        x.strokeStyle = p.c; x.lineWidth = 1.2;
        x.beginPath(); x.moveTo(px, py); x.lineTo(px - Math.cos(p.a) * 9, py - Math.sin(p.a) * 9); x.stroke();
      });
      x.globalAlpha = 1;
      if (++t < 62) raf = requestAnimationFrame(frame); else x.clearRect(0, 0, c.width, c.height);
    };
    frame();
    return () => cancelAnimationFrame(raf);
  }, [burst]);
  return <canvas ref={ref} className="confetti" />;
}

function Curtain({ k }) {
  return (
    <motion.div key={k} className="curtain" initial={{ clipPath: 'inset(100% 0 0 0 round 32px)' }}
      animate={{ clipPath: ['inset(100% 0 0 0 round 32px)', 'inset(0% 0 0 0 round 0px)', 'inset(0 0 100% 0 round 32px)'] }}
      transition={{ duration: 1.05, times: [0, 0.45, 1], ease: [0.76, 0, 0.24, 1] }} />
  );
}

// ---------- app ----------
export default function App() {
  const [step, setStep] = useState('welcome'), [phone, setPhone] = useState(''), [rid, setRid] = useState(null), [myLanding, setLanding] = useState('00:00'), [burst, setBurst] = useState(0);
  const joined = (id, landing) => { setRid(id); setLanding(landing); setStep('radar'); setTimeout(() => setStep('matches'), 3000); };
  return (
    <>
      <main className="app">
        <header><Logo /><div className="live"><i />live pools</div></header>
        <Curtain k={step} />
        <AnimatePresence mode="wait">
          {step === 'welcome' && <Welcome key="w" next={() => setStep('phone')} />}
          {step === 'phone' && <PhoneStep key="p" phone={phone} setPhone={setPhone} onVerified={() => setStep('trip')} />}
          {step === 'trip' && <TripStep key="t" phone={phone} onJoined={joined} />}
          {step === 'radar' && <Radar key="r" />}
          {step === 'matches' && <Matches key="m" rid={rid} myLanding={myLanding} onBurst={() => setBurst(b => b + 1)} />}
        </AnimatePresence>
        <footer>CabPool &middot; airport arrivals</footer>
      </main>
      <Burst burst={burst} />
    </>
  );
                                                       }
