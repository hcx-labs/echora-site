import { useMemo, useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { GlowCard, Reveal } from "../components/chrome";
import "./find.css";

// A short melody as (beat, semitone) steps; the hummed take wobbles around it, a little late and flat.
const MELODY = [0, 0, 2, 4, 4, 2, 0, -1, -3, -3, -1, 0, 2, 2, 0, 0];

function contour(wobble: number, lag: number) {
  const W = 560;
  const H = 180;
  const step = W / MELODY.length;
  const pts: string[] = [];
  for (let i = 0; i < MELODY.length; i++) {
    for (let k = 0; k < 6; k++) {
      const x = i * step + (k / 6) * step + lag;
      const vib = wobble ? Math.sin((i * 6 + k) * 1.3) * wobble + Math.sin(i * 2.1) * wobble * 0.8 : 0;
      const y = H / 2 - MELODY[i] * 13 + vib + (wobble ? 4 : 0);
      pts.push(`${pts.length ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`);
    }
  }
  return pts.join(" ");
}

function HumCard() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "center 45%"] });
  const hum = useTransform(scrollYProgress, [0, 0.7], [0, 1]);
  const match = useTransform(scrollYProgress, [0.55, 1], [0, 1]);
  const glow = useTransform(scrollYProgress, [0.85, 1], [0, 1]);
  const hummed = useMemo(() => contour(3.2, 10), []);
  const melody = useMemo(() => contour(0, 0), []);
  return (
    <GlowCard className="find-card find-hum">
      <div ref={ref} className="hum-viz">
        <svg viewBox="0 -10 570 200" aria-hidden>
          {[...Array(7)].map((_, i) => (
            <line key={i} x1="0" x2="570" y1={20 + i * 25} y2={20 + i * 25} stroke="rgb(168 206 250 / 0.07)" />
          ))}
          <motion.path d={melody} fill="none" stroke="#ff8fb1" strokeWidth="10" strokeLinecap="round" style={{ pathLength: match, opacity: glow }} filter="blur(8px)" />
          <motion.path d={melody} fill="none" stroke="#ff8fb1" strokeWidth="2.5" strokeLinecap="round" style={{ pathLength: match }} />
          <motion.path d={hummed} fill="none" stroke="#a8cefa" strokeWidth="2" strokeLinecap="round" strokeDasharray="1 0" style={{ pathLength: hum }} opacity="0.85" />
        </svg>
        <div className="hum-legend mono">
          <span className="ice">your hum</span>
          <span className="rose">closest melody in your library</span>
        </div>
      </div>
      <div className="find-text">
        <h3 className="h-card">Hum to search</h3>
        <p className="muted">
          Hum or sing a few seconds. Echora compares its pitch contour with the melodies it extracted from your tracks, so off-key and
          off-tempo still find their way home.
        </p>
      </div>
    </GlowCard>
  );
}

export default function Find() {
  return (
    <section className="section find" id="find">
      <div className="wrap">
        <div className="section-head">
          <Reveal delay={0.05}>
            <span className="marker">Find</span>
            <h2 className="h-section">
              Half a tune is <span className="glow-text">enough.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="lede">Search by humming a melody, by a song playing in the room, or by what the audio itself says about a track: its voice, its lyrics and their language.</p>
          </Reveal>
        </div>
        <div className="find-grid">
          <Reveal className="span-2">
            <HumCard />
          </Reveal>
          <Reveal delay={0.05}>
            <GlowCard className="find-card">
              <div className="identify" aria-hidden>
                <span />
                <span />
                <span />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <rect x="9" y="3" width="6" height="11" rx="3" />
                  <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                </svg>
              </div>
              <div className="find-text">
                <h3 className="h-card">Identify song</h3>
                <p className="muted">Let the microphone hear a song playing nearby and Echora finds that recording in your library. Opt-in, off by default.</p>
              </div>
            </GlowCard>
          </Reveal>
          <Reveal delay={0.1}>
            <GlowCard className="find-card">
              <div className="filters" aria-hidden>
                <span className="chip">Has vocals</span>
                <span className="chip">Lyrics · AI-written</span>
                <span className="chip">Japanese</span>
                <span className="chip">Instrumental</span>
                <span className="chip">Romanized Hindi</span>
              </div>
              <div className="find-text">
                <h3 className="h-card">Filters that understand the audio</h3>
                <p className="muted">Narrow by artist and album, and by whether a track has vocals, whether lyrics exist, who wrote them, and their language.</p>
              </div>
            </GlowCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
