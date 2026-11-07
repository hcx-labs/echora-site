import { useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { Link } from "react-router-dom";
import { GlowCard, Reveal } from "../components/chrome";
import "./pipeline.css";

const STEPS = [
  { title: "Identity", text: "Each file is known by a hash of its bytes, so a renamed or moved file is recognized. Chromaprint notices when two files hold the same recording and links them without deleting either." },
  { title: "Preparation", text: "Audio is decoded once per purpose. A vocal separator splits off the singing for the steps that share it." },
  { title: "Analysis", text: "A set of models each record one aspect of the track: its meaning, its sound, its lyrics, its melody, its voice." },
  { title: "Indexing", text: "Vectors land in PostgreSQL with pgvector. The galaxy, search, curations and the Navidrome plugin all read from there." },
];

const MODELS: { name: string; role: string; step: number; kara?: boolean }[] = [
  { name: "SHA-256 · Chromaprint", role: "Track identity", step: 0 },
  { name: "Mel-Band RoFormer", role: "Vocal separation", step: 1 },
  { name: "MuQ-MuLan", role: "Musical meaning", step: 2 },
  { name: "MERT", role: "Acoustic structure", step: 2 },
  { name: "BGE-M3", role: "Lyrics meaning", step: 2 },
  { name: "Essentia Discogs-EffNet", role: "Vocals", step: 2 },
  { name: "Essentia MELODIA", role: "Melody", step: 2 },
  { name: "fastText LID-176 · IndicLID", role: "Language", step: 2 },
  { name: "Echora Kara 300M", role: "Karaoke timing", step: 2, kara: true },
  { name: "Echora MOSS transcriber", role: "Lyrics for songs without", step: 2 },
  { name: "Semantic fusion · pgvector", role: "Combined space", step: 3 },
];

export default function Pipeline() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(-1);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 60%"] });
  useMotionValueEvent(scrollYProgress, "change", (p) => setActive(p <= 0 ? -1 : Math.min(3, Math.floor(p * 4))));
  return (
    <section className="section pipeline" id="sync">
      <div className="wrap">
        <div className="section-head">
          <Reveal delay={0.05}>
            <span className="marker">Sync</span>
            <h2 className="h-section">
              One sync. <span className="glow-text">Every track, studied.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="lede">
              Echora reads your Navidrome catalog and analyzes whatever is new or out of date, in durable background batches. A failed track
              never blocks the others, and every result records the exact model revision that produced it.
            </p>
          </Reveal>
        </div>
        <div className="pipe-grid" ref={ref}>
          <div className="pipe-steps">
            <div className="pipe-rail" aria-hidden>
              <motion.div className="pipe-beam" style={{ scaleY: scrollYProgress }} />
            </div>
            <ol>
            {STEPS.map((s, i) => (
              <li key={s.title} className={i <= active ? "lit" : undefined}>
                <span className="pipe-node mono">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="h-card">{s.title}</h3>
                  <p className="muted">{s.text}</p>
                </div>
              </li>
            ))}
            </ol>
          </div>
          <GlowCard className="pipe-rack">
            <span className="cur-key">Models, pinned and offline</span>
            <ul>
              {MODELS.map((m) => (
                <li key={m.name} className={`${m.step === active ? "on" : ""} ${m.kara ? "kara" : ""}`}>
                  <span className="dot" />
                  {m.kara ? (
                    <Link to="/kara" className="name">
                      {m.name}
                    </Link>
                  ) : (
                    <span className="name">{m.name}</span>
                  )}
                  <span className="role">{m.role}</span>
                </li>
              ))}
            </ul>
            <p className="muted rack-note">Downloaded once at pinned revisions, then run offline. An upstream update can never change your results until you choose it.</p>
          </GlowCard>
        </div>
      </div>
    </section>
  );
}
