import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { GlowCard, Reveal } from "../components/chrome";
import "./curations.css";

const AXES = ["Pace", "Energy", "Brightness", "Motion", "Vocals", "Dynamics"] as const;
type Shape = Record<(typeof AXES)[number], number>;

const PRESETS: { name: string; sounds: string[]; theme: string; shape: Shape }[] = [
  {
    name: "Rainy commute",
    sounds: ["+piano", "+strings", "-synths"],
    theme: "songs about leaving home",
    shape: { Pace: 0.3, Energy: 0.35, Brightness: 0.4, Motion: 0.45, Vocals: 0.75, Dynamics: 0.7 },
  },
  {
    name: "Night drive",
    sounds: ["+synths", "+bass", "-acoustic guitar"],
    theme: "city lights after midnight",
    shape: { Pace: 0.7, Energy: 0.65, Brightness: 0.55, Motion: 0.85, Vocals: 0.45, Dynamics: 0.4 },
  },
  {
    name: "Sunday morning",
    sounds: ["+acoustic guitar", "+soft vocals", "-distortion"],
    theme: "slow, grateful, unhurried",
    shape: { Pace: 0.35, Energy: 0.25, Brightness: 0.8, Motion: 0.3, Vocals: 0.65, Dynamics: 0.35 },
  },
];

function Radar({ shape }: { shape: Shape }) {
  const R = 120;
  const pt = (i: number, v: number) => {
    const a = (i / AXES.length) * Math.PI * 2 - Math.PI / 2;
    return [Math.cos(a) * R * v, Math.sin(a) * R * v] as const;
  };
  const poly = AXES.map((k, i) => pt(i, 0.12 + shape[k] * 0.88).join(",")).join(" ");
  return (
    <svg viewBox="-170 -150 340 300" className="radar" role="img" aria-label="Sound shape radar">
      <defs>
        <radialGradient id="rfill">
          <stop offset="0" stopColor="#ff8fb1" stopOpacity="0.45" />
          <stop offset="1" stopColor="#a8cefa" stopOpacity="0.18" />
        </radialGradient>
        <filter id="rglow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <polygon key={r} points={AXES.map((_, i) => pt(i, r).join(",")).join(" ")} fill="none" stroke="rgb(168 206 250 / 0.14)" />
      ))}
      {AXES.map((k, i) => {
        const [x, y] = pt(i, 1);
        const [lx, ly] = pt(i, 1.2);
        return (
          <g key={k}>
            <line x1="0" y1="0" x2={x} y2={y} stroke="rgb(168 206 250 / 0.12)" />
            <text x={lx} y={ly + 4} textAnchor="middle" className="radar-label">
              {k}
            </text>
          </g>
        );
      })}
      <motion.polygon animate={{ points: poly }} transition={{ type: "spring", stiffness: 120, damping: 18 }} fill="#ff8fb1" opacity="0.5" filter="url(#rglow)" />
      <motion.polygon animate={{ points: poly }} transition={{ type: "spring", stiffness: 120, damping: 18 }} fill="url(#rfill)" stroke="#ffd2e0" strokeWidth="1.5" />
    </svg>
  );
}

export default function Curations() {
  const [preset, setPreset] = useState(0);
  const [shape, setShape] = useState<Shape>(PRESETS[0].shape);
  const [published, setPublished] = useState(false);
  const p = PRESETS[preset];
  const pick = (i: number) => {
    setPreset(i);
    setShape(PRESETS[i].shape);
    setPublished(false);
  };
  return (
    <section className="section curations" id="curations">
      <div className="wrap">
        <div className="section-head">
          <Reveal delay={0.05}>
            <span className="marker">Curations</span>
            <h2 className="h-section">
              Write the recipe. <span className="glow-text">Echora finds the songs.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="lede">
              A curation is a saved recipe for a playlist: sounds to add or avoid, a lyrical theme, a language, example songs, a time period
              or a journey. Shape the sound, preview, and Echora publishes it to Navidrome and can rebuild it on a schedule.
            </p>
          </Reveal>
        </div>
        <Reveal>
          <div className="cur-grid">
            <GlowCard className="cur-recipe">
              <div className="cur-presets" role="tablist" aria-label="Example recipes">
                {PRESETS.map((x, i) => (
                  <button key={x.name} role="tab" aria-selected={i === preset} className={i === preset ? "on" : undefined} onClick={() => pick(i)}>
                    {x.name}
                  </button>
                ))}
              </div>
              <div className="cur-field">
                <span className="cur-key">Sounds</span>
                <div className="cur-chips">
                  <AnimatePresence mode="popLayout">
                    {p.sounds.map((s, i) => (
                      <motion.span
                        key={p.name + s}
                        className={`chip ${s.startsWith("-") ? "minus" : ""}`}
                        initial={{ opacity: 0, scale: 0.8, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ delay: i * 0.06 }}
                      >
                        {s}
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
              <div className="cur-field">
                <span className="cur-key">Lyrical theme</span>
                <AnimatePresence mode="wait">
                  <motion.span key={p.theme} className="cur-theme" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}>
                    “{p.theme}”
                  </motion.span>
                </AnimatePresence>
              </div>
              <div className="cur-sliders">
                {AXES.map((k) => (
                  <label key={k} className="cur-slider">
                    <span>{k}</span>
                    <input
                      id={`shape-${k}`}
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={shape[k]}
                      style={{ "--v": `${shape[k] * 100}%` } as React.CSSProperties}
                      onChange={(e) => {
                        setShape({ ...shape, [k]: Number(e.target.value) });
                        setPublished(false);
                      }}
                    />
                  </label>
                ))}
              </div>
            </GlowCard>
            <GlowCard className="cur-shape">
              <span className="cur-key">Sound shape</span>
              <Radar shape={shape} />
              <div className="cur-publish">
                <button className={`btn ${published ? "" : "btn-primary"}`} onClick={() => setPublished(true)}>
                  {published ? "Published to Navidrome ✓" : "Publish as playlist"}
                </button>
                <span className="muted">Refreshes on a schedule. Last.fm can balance favourites against forgotten songs.</span>
              </div>
            </GlowCard>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
