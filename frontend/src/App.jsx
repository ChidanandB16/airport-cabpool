import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, useGLTF } from '@react-three/drei';
import { KTX2Loader } from 'three-stdlib';
import * as THREE from 'three';
import Lenis from 'lenis';
import { api } from './api.js';

const HERO_PHOTO = 'https://images.unsplash.com/photo-1474302770737-173ee21bab63?auto=format&fit=crop&w=2000&q=75';

const ease = [0.16, 1, 0.3, 1];
const screen = {
  initial: { x: '60%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.9, ease: [0.76, 0, 0.24, 1], staggerChildren: 0.08, delayChildren: 0.25 } },
  exit: { x: '-35%', opacity: 0, transition: { duration: 0.55, ease: [0.76, 0, 0.24, 1] } }
};
const item = { initial: { opacity: 0, y: 22 }, animate: { opacity: 1, y: 0, transition: { duration: 0.9, ease } } };

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

// ---------- 3D scroll story ----------
// Pinned WebGL scrollytelling (WAMOS / Qantas Dreamliner pattern on Awwwards):
// the view is pinned while scroll drives a CC0 3D airliner across the sky,
// then a CC0 3D taxi rolls in and stops at the orange pickup dot.
const ktx2 = new KTX2Loader().setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.187.0/examples/jsm/libs/basis/');
const useModel = path => {
  const gl = useThree(s => s.gl);
  return useGLTF(path, true, true, loader => {
    ktx2.detectSupport(gl);
    loader.setKTX2Loader(ktx2);
  });
};

const clamp01 = v => Math.max(0, Math.min(1, v));
const seg = (p, a, b) => clamp01((p - a) / (b - a));
const easeIO = t => t * t * (3 - 2 * t);

function PlaneRig({ progress }) {
  const { scene } = useModel('https://tevy.dev/models/narrowbody-airliner/v1/lod1.glb');
  const ref = useRef();
  // model has baked-in offset + non-meter units: normalise to a 2.6-unit fuselage centred at origin
  const norm = useMemo(() => {
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    return { s: 2.0 / Math.max(size.x, size.z), center };
  }, [scene]);
  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;
    const p = progress.get();
    const t = easeIO(seg(p, 0.02, 0.56));
    const d = 4.5;
    g.position.x = THREE.MathUtils.damp(g.position.x, THREE.MathUtils.lerp(-2.9, 3.1, t), d, dt);
    g.position.y = THREE.MathUtils.damp(g.position.y, THREE.MathUtils.lerp(1.7, 0.15, t) + Math.sin(t * Math.PI * 2.2) * 0.08, d, dt);
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, -0.18 * (1 - t), d, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, 0.06 * Math.sin(t * Math.PI), d, dt);
    g.visible = p < 0.62;
  });
  return (
    <group ref={ref} position={[-5.4, 1.7, 0]} rotation={[0, Math.PI / 2, 0]}>
      <group scale={norm.s} position={[-norm.center.x * norm.s, -norm.center.y * norm.s, -norm.center.z * norm.s]}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

function TaxiRig({ progress }) {
  const { scene } = useModel('https://tevy.dev/models/yellow-taxi/v1/lod1.glb');
  const ref = useRef();
  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;
    const p = progress.get();
    const t = easeIO(seg(p, 0.62, 0.97));
    const d = 4.5;
    g.position.x = THREE.MathUtils.damp(g.position.x, THREE.MathUtils.lerp(-3.0, -0.1, t), d, dt);
    g.position.y = -1.18 + Math.abs(Math.sin(t * Math.PI * 4)) * 0.045 * (1 - t);
    g.rotation.z = -0.02 * Math.sin(t * Math.PI * 2) * (1 - t);
    g.visible = p > 0.56;
  });
  return <primitive ref={ref} object={scene} scale={0.5} position={[-5.6, -1.18, 0.2]} rotation={[0, Math.PI / 2, 0]} />;
}

function DestDot({ progress }) {
  const ref = useRef();
  useFrame(state => {
    const g = ref.current;
    if (!g) return;
    const a = seg(progress.get(), 0.9, 0.97);
    g.scale.setScalar(Math.max(0.0001, a * 0.13 * (1 + Math.sin(state.clock.elapsedTime * 3.4) * 0.22)));
  });
  return (
    <mesh ref={ref} position={[1.42, -1.08, 0.2]}>
      <sphereGeometry args={[1, 24, 24]} />
      <meshBasicMaterial color="#F24E1E" toneMapped={false} />
    </mesh>
  );
}

function StoryScene({ progress }) {
  return (
    <Canvas className="story-canvas" camera={{ position: [0, 0.35, 9.5], fov: 34 }} gl={{ alpha: true, antialias: true }} dpr={[1, 2]}>
      <ambientLight intensity={1.15} />
      <directionalLight position={[3.5, 5, 4]} intensity={1.35} />
      <Suspense fallback={null}>
        <PlaneRig progress={progress} />
        <TaxiRig progress={progress} />
        <DestDot progress={progress} />
        <ContactShadows position={[0, -1.42, 0]} opacity={0.34} scale={15} blur={2.6} far={3.2} color="#161616" />
      </Suspense>
    </Canvas>
  );
}

function FlightStory() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const cap1o = useTransform(scrollYProgress, [0.05, 0.15, 0.36, 0.46], [0, 1, 1, 0]);
  const cap1y = useTransform(scrollYProgress, [0.05, 0.15], [20, 0]);
  const cap2o = useTransform(scrollYProgress, [0.62, 0.72], [0, 1]);
  const cap2y = useTransform(scrollYProgress, [0.62, 0.72], [20, 0]);
  return (
    <div className="story" ref={ref}>
      <div className="story-stage">
        <StoryScene progress={scrollYProgress} />
        <motion.div className="story-cap" style={{ opacity: cap1o, y: cap1y }}>
          <h3>You land.</h3>
        </motion.div>
        <motion.div className="story-cap" style={{ opacity: cap2o, y: cap2y }}>
          <h3>Your cab's <span className="accent-serif">already waiting.</span></h3>
        </motion.div>
      </div>
    </div>
  );
}

// Aceternity UI "Container Scroll Animation" pattern (MIT):
// a card tilts in 3D perspective and settles flat as it scrolls into view.
function TiltCard({ children }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [18, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);
  return (
    <div ref={ref} style={{ perspective: 1000 }}>
      <motion.div className="tilt-card" style={{ rotateX, scale, transformOrigin: 'center top' }}>
        {children}
      </motion.div>
    </div>
  );
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
    <motion.section className="screen hero-story" {...screen}>
      <div className="hero-panel">
        <motion.div className="hero-bg" style={{ x: bx, y: by, backgroundImage: `linear-gradient(180deg, rgba(238,237,233,.72), rgba(238,237,233,.04) 32%, rgba(238,237,233,.04) 55%, rgba(238,237,233,.97) 90%), url(${HERO_PHOTO})` }}>
          <div className="engine-glow" />
        </motion.div>
        <motion.p className="eyebrow" variants={item}><b />Airport cab pooling</motion.p>
        <h1 className="hero-title">
          <SplitText delay={0.15}>Land. Match.</SplitText><br />
          <span className="accent-serif"><SplitText delay={0.5}>Ride together.</SplitText></span>
        </h1>
        <motion.p className="sub" variants={item}>One cab from the airport, split fairly with people landing next to you.</motion.p>
        <motion.div className="cta-row" variants={item}>
          <Btn onClick={next}>Get started &rarr;</Btn>
        </motion.div>
        <motion.div className="scroll-hint" variants={item}><span>scroll</span><i /></motion.div>
      </div>
      <FlightStory />
      <TiltCard>
        <p className="eyebrow"><b />One cab, split fairly</p>
        <h3 className="final-title">Split the ride, <span className="accent-serif">not the wait.</span></h3>
        <p className="sub">Same flight window, same destination, one fair fare.</p>
        <div className="cta-row"><Btn onClick={next}>Get started &rarr;</Btn></div>
      </TiltCard>
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
  const lenisRef = useRef(null);

  // Lenis smooth scrolling (MIT, Studio Freight) - the Awwwards-standard scroll feel.
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenisRef.current = lenis;
    let raf;
    const loop = t => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); };
  }, []);

  useEffect(() => {
    if (lenisRef.current) lenisRef.current.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [step]);

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
