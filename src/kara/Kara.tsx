import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { GithubIcon, GlowCard, HfIcon, LINKS, Reveal } from "../components/chrome";
import "./kara.css";

/* ---------- Hero ---------- */

const HERO_SYLS = ["Hold", "the", "light", "a", "lit", "tle", "long", "er", "and", "sing", "it", "back"];

function AlignStrip() {
  // Static waveform and syllable blocks; only the playhead moves, as a transform.
  const bars = useMemo(() => Array.from({ length: 160 }, (_, i) => 0.15 + 0.85 * Math.abs(Math.sin(i * 0.37) * Math.cos(i * 0.11 + 1) * (0.6 + 0.4 * Math.sin(i * 1.7)))), []);
  const blocks = useMemo(() => {
    let x = 3;
    return HERO_SYLS.map((s, i) => {
      const w = 4 + ((i * 7) % 4) + s.length * 0.9;
      const b = { s, x, w };
      x += w + 0.9 + (i === 7 ? 3 : 0);
      return b;
    });
  }, []);
  return (
    <div className="strip" aria-hidden>
      <div className="strip-syls">
        {blocks.map((b, i) => (
          <span key={i} style={{ left: `${b.x}%`, width: `${b.w}%`, animationDelay: `${(b.x / 100) * 7}s` }}>
            {b.s}
          </span>
        ))}
      </div>
      <div className="strip-wave">
        {bars.map((h, i) => (
          <i key={i} style={{ height: `${h * 100}%` }} />
        ))}
      </div>
      <div className="strip-head" />
    </div>
  );
}

function KaraHero() {
  return (
    <section className="kara-hero">
      <div className="wrap kara-hero-copy">
        <span className="marker rose">Alignment model · AGPL-3.0 · Hugging Face</span>
        <h1 className="h-display">
          Echora <span className="rose-text">Kara</span>
        </h1>
        <p className="lede">
          Syllable-level lyrics alignment for karaoke, run directly on the original song mix. No vocal separation at inference: give it a
          song and its lyrics, and it works out when every word and syllable is sung.
        </p>
        <div className="hero-cta">
          <a className="btn btn-primary" href={LINKS.karaModel} target="_blank" rel="noreferrer">
            <HfIcon /> Model on Hugging Face
          </a>
          <a className="btn" href={LINKS.kara} target="_blank" rel="noreferrer">
            <GithubIcon /> Training code
          </a>
        </div>
      </div>
      <div className="wrap">
      <AlignStrip />
      <div className="kara-stats">
        {[
          ["38.8", "ms", "median word-start error"],
          ["96.9", "%", "of words within 300 ms"],
          ["21,580", "", "words across 79 songs, 4 languages"],
          ["361", "M", "trainable parameters, plus frozen MuQ"],
        ].map(([n, u, l]) => (
          <div key={l}>
            <span className="num">
              {n}
              <small>{u}</small>
            </span>
            <span className="muted">{l}</span>
          </div>
        ))}
      </div>
      </div>
      </section>
  );
}

/* ---------- How it works: four steps, advancing on their own ---------- */

const STEPS = [
  { title: "Normalize the lyrics", text: "Each line becomes acoustic units, roughly syllables, spelled with a 30-symbol alphabet. English, German and French are spelled by sound; other scripts are romanised by reading." },
  { title: "Listen, frame by frame", text: "A wav2vec2-style encoder turns 16 kHz audio into 20 ms frames, with MuQ music features fused into every frame. Each head scores every letter at every frame." },
  { title: "Decode the whole song at once", text: "One constrained Viterbi alignment of all units against the full song. Quiet frames cost more, gaps inside a line are discouraged, durations follow the line's pace, and the text head adds its evidence." },
  { title: "Write the timings", text: "Unit boundaries become line, word and syllable times: ASS karaoke tags, enhanced LRC and a JSON alignment document." },
];

const NORMALIZE = [
  { lang: "Japanese", src: "心に歌", units: ["こ", "こ", "ろ", "に", "う", "た"], letters: ["ko", "ko", "ro", "ni", "u", "ta"] },
  { lang: "Korean", src: "음악이", units: ["으", "마", "기"], letters: ["eu", "ma", "gi"] },
  { lang: "Mandarin", src: "你好", units: ["你", "好"], letters: ["ni", "hao"] },
];

const LETTERS = ["k", "o", "k", "o", "r", "o", "n", "i", "u", "t", "a"];
const FRAMES = 44;

function Posteriors({ decoded }: { decoded: boolean }) {
  // A plausible diagonal band of evidence with noise, and the monotonic path through it.
  const { cells, path, activity } = useMemo(() => {
    const starts = [3, 6, 9, 12, 14, 17, 21, 24, 28, 33, 36, 42];
    const cells: { r: number; c: number; v: number }[] = [];
    LETTERS.forEach((_, r) => {
      for (let c = 0; c < FRAMES; c++) {
        const inside = c >= starts[r] && c < starts[r + 1];
        const near = Math.min(Math.abs(c - starts[r]), Math.abs(c - starts[r + 1]));
        const noise = Math.abs(Math.sin(r * 12.9898 + c * 78.233) * 43758.5453) % 1;
        const v = inside ? 0.65 + noise * 0.35 : Math.max(0, 0.35 - near * 0.12) * noise + noise * 0.05;
        cells.push({ r, c, v });
      }
    });
    const pts: string[] = [];
    LETTERS.forEach((_, r) => {
      pts.push(`${starts[r] * 10},${r * 10 + 5}`, `${starts[r + 1] * 10},${r * 10 + 5}`);
    });
    const activity = Array.from({ length: FRAMES }, (_, c) => (c < 3 || c === 28 ? 0.1 : 0.5 + 0.5 * Math.abs(Math.sin(c * 0.7))));
    return { cells, path: pts.join(" "), activity };
  }, []);
  return (
    <svg viewBox={`-26 -4 ${FRAMES * 10 + 30} ${LETTERS.length * 10 + 26}`} className="post" role="img" aria-label="Letter probabilities per frame, with the decoded alignment path">
      {LETTERS.map((l, r) => (
        <text key={r} x={-14} y={r * 10 + 8} className="post-label">
          {l}
        </text>
      ))}
      {cells.map(({ r, c, v }) => (
        <rect key={`${r}-${c}`} x={c * 10 + 0.6} y={r * 10 + 0.6} width={8.8} height={8.8} fill="#a8cefa" opacity={0.04 + v * 0.8} />
      ))}
      {activity.map((a, c) => (
        <rect key={c} x={c * 10 + 0.6} y={LETTERS.length * 10 + 6} width={8.8} height={8} fill={a < 0.2 ? "#ff8fb1" : "#8ff0d2"} opacity={a < 0.2 ? 0.7 : a * 0.6} />
      ))}
      <text x={-14} y={LETTERS.length * 10 + 13} className="post-label">
        va
      </text>
      <polyline points={path} fill="none" stroke="#ff8fb1" strokeWidth="2.4" strokeLinejoin="miter" className={`post-path ${decoded ? "on" : ""}`} pathLength={1} />
    </svg>
  );
}

function StepVisual({ step, active }: { step: number; active: boolean }) {
  if (step === 0)
    return (
      <div className="norm">
        {NORMALIZE.map((n) => (
          <div key={n.lang} className="norm-row">
            <span className="norm-lang">{n.lang}</span>
            <span className="norm-src">{n.src}</span>
            <span className="norm-arrow">→</span>
            <span className="norm-units">
              {n.units.map((u, i) => (
                <b key={i}>{u}</b>
              ))}
            </span>
            <span className="norm-arrow">→</span>
            <span className="norm-letters">
              {n.letters.map((u, i) => (
                <b key={i}>{u}</b>
              ))}
            </span>
          </div>
        ))}
        <p className="muted small">Illustrative. Label rules are versioned, and a model always runs with the rules it was trained on.</p>
      </div>
    );
  if (step === 3)
    return (
      <pre className="out">
        <code>
          <span className="c">; o_ruby.lrc · enhanced LRC</span>
          {"\n"}[00:12.48]<i>&lt;00:12.48&gt;</i>心<i>&lt;00:12.91&gt;</i>に<i>&lt;00:13.20&gt;</i>歌
          {"\n\n"}
          <span className="c">; o.ass · karaoke tags in centiseconds</span>
          {"\n"}Dialogue: 0,0:00:12.48,0:00:13.86,Default,,0,0,0,,
          {"\n"}
          {"{\\k43}心{\\k29}に{\\k66}歌"}
          {"\n\n"}
          <span className="c">// o.alignment.json</span>
          {"\n"}
          {'{ "text": "歌", "start": 13.20, "end": 13.86 }'}
        </code>
      </pre>
    );
  return (
    <div className="post-wrap">
      <Posteriors decoded={step === 2 && active} />
      <div className="post-legend mono">
        <span className="ice">letter evidence per 20 ms frame</span>
        {step === 2 ? <span className="rose">decoded path · quiet frames penalised</span> : <span className="mint">vocal activity</span>}
      </div>
    </div>
  );
}

function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const inView = useInView(ref, { margin: "-20% 0px" });
  // Advance on a timer while on screen; picking a step restarts the timer from there.
  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => setStep((s) => (s + 1) % 4), 5200);
    return () => clearTimeout(t);
  }, [inView, step]);
  // Every description gets the room of the longest one, so the list keeps one height as it cycles.
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const ol = list.current;
    if (!ol) return;
    const fit = () => ol.style.setProperty("--desc", `${Math.max(...[...ol.querySelectorAll("p")].map((p) => p.scrollHeight))}px`);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(ol);
    return () => ro.disconnect();
  }, []);
  return (
    <section className="section how" ref={ref}>
      <div className="how-sticky">
        <div className="wrap how-grid">
          <div className="how-steps">
            <div>
              <span className="marker">How it works</span>
              <h2 className="h-section">
                Four steps from <span className="glow-text">text to time.</span>
              </h2>
            </div>
            <ol ref={list}>
              {STEPS.map((s, i) => (
                <li key={s.title} className={i === step ? "on" : i < step ? "done" : undefined} onClick={() => setStep(i)}>
                  <span className="num">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="h-card">{s.title}</h3>
                    <p className="muted">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="how-visual ticks">
            {/* All four stacked in one cell, so the panel is always as tall as the tallest. */}
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                className="how-layer"
                aria-hidden={i !== step}
                initial={false}
                animate={i === step ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                style={{ pointerEvents: i === step ? "auto" : "none" }}
              >
                <StepVisual step={i} active={i === step} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Architecture ---------- */

type Node = { id: string; x: number; y: number; w: number; title: string; sub: string; tone?: "rose" | "mint" };
const NODES: Node[] = [
  { id: "audio", x: 0, y: 75, w: 170, title: "Song audio", sub: "original mix" },
  { id: "lyrics", x: 0, y: 360, w: 170, title: "Lyrics", sub: "one sung line per line" },
  { id: "enc", x: 230, y: 20, w: 200, title: "Acoustic encoder", sub: "wav2vec2 · 24 layers" },
  { id: "muq", x: 230, y: 130, w: 200, title: "MuQ-large", sub: "frozen + LoRA" },
  { id: "fuse", x: 490, y: 75, w: 120, title: "Fusion", sub: "gated · layer 11", tone: "mint" },
  { id: "norm", x: 230, y: 360, w: 200, title: "Normalizer", sub: "romanised letters" },
  { id: "ctc", x: 670, y: 0, w: 190, title: "CTC head", sub: "lead vocals" },
  { id: "bg", x: 670, y: 85, w: 190, title: "Background head", sub: "backing vocals" },
  { id: "edge", x: 670, y: 170, w: 190, title: "Edge head", sub: "unit onsets" },
  { id: "text", x: 670, y: 270, w: 190, title: "Text head", sub: "cross-attends to lyrics" },
  { id: "dec", x: 920, y: 150, w: 180, title: "Alignment engine", sub: "global constrained CTC", tone: "rose" },
  { id: "out", x: 920, y: 330, w: 180, title: "Timings", sub: "ASS · LRC · JSON", tone: "rose" },
];
const EDGES: [string, string][] = [
  ["audio", "enc"], ["audio", "muq"], ["enc", "fuse"], ["muq", "fuse"], ["fuse", "ctc"], ["fuse", "bg"], ["fuse", "edge"], ["fuse", "text"],
  ["lyrics", "norm"], ["norm", "text"], ["norm", "dec"], ["ctc", "dec"], ["bg", "dec"], ["edge", "dec"], ["text", "dec"], ["dec", "out"],
];
const H = 58;

function Architecture() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));
  return (
    <section className="section">
      <div className="wrap">
        <div className="section-head">
          <Reveal>
            <span className="marker">Architecture</span>
            <h2 className="h-section">
              It hears the band, <span className="glow-text">follows the voice.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="lede">
              MuQ is the only part that has heard music beyond the training set, and it is what keeps the aligner on the singer in dense mixes.
              It joins every frame through a gate that starts closed, so training begins from a plain aligner.
            </p>
          </Reveal>
        </div>
        <div className="arch-scroll" ref={ref}>
          <svg viewBox="-2 -10 1106 440" className={`arch ${inView ? "in" : ""}`} role="img" aria-label="Echora Kara architecture: audio and lyrics flow through the encoder, MuQ, normalizer and four heads into the alignment engine, which writes timings.">
            {EDGES.map(([a, b], i) => {
              const A = byId[a];
              const B = byId[b];
              const x1 = A.x + A.w;
              const y1 = A.y + H / 2;
              const x2 = B.x;
              const y2 = B.y + H / 2;
              // Lyrics reach the engine below the heads; the engine drops straight down to its output.
              const mx = a === "norm" && b === "dec" ? 890 : (x1 + x2) / 2;
              const d =
                a === "dec" && b === "out"
                  ? `M${A.x + A.w / 2} ${A.y + H} V${B.y}`
                  : `M${x1} ${y1} H${mx} V${y2} H${x2}`;
              return (
                <g key={i}>
                  <path d={d} className="arch-edge" />
                  <path d={d} className="arch-flow" style={{ animationDelay: `${(i % 5) * 0.35}s` }} pathLength={100} />
                </g>
              );
            })}
            {NODES.map((n, i) => (
              <g key={n.id} className={`arch-node ${n.tone ?? ""}`} style={{ transitionDelay: `${i * 0.05}s` }}>
                <rect x={n.x} y={n.y} width={n.w} height={H} rx={8} />
                <text x={n.x + 14} y={n.y + 25} className="t">
                  {n.title}
                </text>
                <text x={n.x + 14} y={n.y + 44} className="s">
                  {n.sub}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
}

/* ---------- Benchmark ---------- */

const LANGS = [
  { lang: "German", median: 29.4, mean: 54.7, w300: 98.8 },
  { lang: "English", median: 37.3, mean: 119.2, w300: 95.9 },
  { lang: "Spanish", median: 35.9, mean: 96.8, w300: 98.2 },
  { lang: "French", median: 56.1, mean: 180.0, w300: 94.7 },
];

function Benchmark() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  return (
    <section className="section bench">
      <div className="wrap">
        <div className="section-head">
          <Reveal>
            <span className="marker rose">Benchmark</span>
            <h2 className="h-section">
              Measured on <span className="rose-text">JamendoLyrics.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="lede">
              79 songs and 21,580 words in English, German, Spanish and French, aligned on the original mix with no separation. Every
              word's predicted start is compared with the reference start.
            </p>
          </Reveal>
        </div>
        <div className="bench-grid" ref={ref}>
          <GlowCard className="bench-langs">
            <span className="kicker">Words within 300 ms, by language</span>
            {LANGS.map((l, i) => (
              <div className="bar-row" key={l.lang}>
                <span className="bar-name h-card">{l.lang}</span>
                <span className="num bar-val">{l.w300}%</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ transform: `scaleX(${inView ? (l.w300 - 80) / 20 : 0})`, transitionDelay: `${i * 0.12}s` }} />
                </div>
                <span className="bar-sub mono">
                  median {l.median} ms · mean {l.mean} ms
                </span>
              </div>
            ))}
            <span className="bar-axis mono">
              <span>80%</span>
              <span>100%</span>
            </span>
          </GlowCard>
          <GlowCard className="bench-ab">
            <span className="kicker">What the text head adds</span>
            {(
              [
                ["Mean error", "113.7 ms", "195.4 ms", 113.7 / 195.4],
                ["Words over 500 ms off", "2.4%", "3.3%", 2.4 / 3.3],
                ["Per-song absolute error", "0.133 s", "0.229 s", 0.133 / 0.229],
              ] as const
            ).map(([k, a, b, r], i) => (
              <div className="ab-row" key={k}>
                <span className="h-card">{k}</span>
                <div className="ab-bars">
                  <div className="ab-bar rose" style={{ transform: `scaleX(${inView ? r : 0})`, transitionDelay: `${0.2 + i * 0.12}s` }} />
                  <span className="num ab-val rose">{a}</span>
                  <div className="ab-bar" style={{ transform: `scaleX(${inView ? 1 : 0})`, transitionDelay: `${0.1 + i * 0.12}s` }} />
                  <span className="num ab-val">{b}</span>
                </div>
              </div>
            ))}
            <div className="ab-legend mono">
              <span className="rose">with the text head</span>
              <span>acoustic heads only</span>
            </div>
          </GlowCard>
        </div>
        <p className="muted small bench-note">
          Checkpoint at step 74,000, labels v3-sung, recommended decoder settings. The text bonus was picked on five of the 79 songs, so the
          figures are lightly tuned to this set. Benchmark:{" "}
          <a href={LINKS.jamendo} target="_blank" rel="noreferrer">
            JamendoLyrics MultiLang
          </a>
          .
        </p>
      </div>
    </section>
  );
}

/* ---------- Model components, languages ---------- */

const PARTS = [
  ["Acoustic encoder", "wav2vec2-style, 24 layers, width 1024, 20 ms frames. Initialised from Meta's omniASR CTC 300M v2.", "315 M"],
  ["Text head", "6 text-encoder layers over the song's letters, then 4 cross-attention layers from audio frames to text.", "38.3 M"],
  ["MuQ LoRA", "Rank-32 adapters on MuQ blocks 4–11, starting at zero.", "6.3 M"],
  ["MuQ fusion", "Layer 11 of frozen MuQ-large, resampled to the 20 ms clock and added through a learned gate.", "1.05 M"],
  ["CTC + background heads", "30 outputs each: letters, apostrophe, word separator, unknown and blank. Backing vocals decode on their own path.", "31 k ×2"],
  ["Edge head", "Per-frame logit that a new unit starts on this frame.", "1 k"],
];

const SCRIPTS = [
  ["English · German · French", "Spelled by pronunciation. Sung reduced vowels resolve to their spelled vowel; long words are cut into syllables."],
  ["Japanese", "Kana readings, one unit per kana."],
  ["Korean", "Hangul pronunciation rules (liaison, assimilation), then romanisation."],
  ["Chinese", "Mandarin pinyin and Cantonese jyutping, without tones."],
  ["Thai, Indic and more", "Romanisation per script."],
];

function Parts() {
  return (
    <section className="section">
      <div className="wrap parts-grid">
        <div>
          <Reveal>
            <span className="marker">Inside</span>
            <h2 className="h-section">
              What's <span className="glow-text">inside.</span>
            </h2>
          </Reveal>
          <ul className="parts">
            {PARTS.map(([n, d, p], i) => (
              <Reveal as="li" key={n} delay={i * 0.04}>
                <span className="h-card">{n}</span>
                <span className="num part-p">{p}</span>
                <span className="muted part-d">{d}</span>
              </Reveal>
            ))}
          </ul>
        </div>
        <div>
          <Reveal>
            <h2 className="h-section">
              Many scripts, <span className="rose-text">one alphabet.</span>
            </h2>
          </Reveal>
          <ul className="parts">
            {SCRIPTS.map(([n, d], i) => (
              <Reveal as="li" key={n} delay={i * 0.04}>
                <span className="h-card">{n}</span>
                <span className="muted part-d">{d}</span>
              </Reveal>
            ))}
          </ul>
          <p className="muted small">Language is identified per document and per line to pick the right rules.</p>
        </div>
      </div>
    </section>
  );
}

/* ---------- Usage ---------- */

const CMD = `uv venv -p 3.12 && uv pip install -e ".[train,data]"
sh scripts/fetch_resources.sh

echora-kara-align --path_io work --input_audio song.flac --input_text i.txt \\
  --model yohane --hf_model_path /models/echora-kara --fusion on \\
  --label_rules v3-sung --lang auto --timing_offset_ms 0 \\
  --min_token_ms 100 --min_letter_ms 40 --duration_pace_ratio 0.9 \\
  --vocal_activity_weight 2.0 --exact_frame_clock \\
  --blank_free_tokens --background_decoding`;

function Usage() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CMD);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };
  return (
    <section className="section">
      <div className="wrap usage-grid">
        <div className="usage-copy">
          <Reveal>
            <span className="marker">Usage</span>
            <h2 className="h-section">
              Align a song <span className="glow-text">yourself.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="lede">
              Kara is the karaoke engine inside Echora, and also a standalone library and command-line tool. Put the lyrics in a text file,
              one sung line per line; lines in brackets are treated as backing vocals.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="hero-cta">
              <a className="btn btn-primary" href={LINKS.karaModel} target="_blank" rel="noreferrer">
                <HfIcon /> echora-kara-300m
              </a>
              <a className="btn" href={LINKS.kara} target="_blank" rel="noreferrer">
                <GithubIcon /> Source
              </a>
            </div>
          </Reveal>
        </div>
        <Reveal delay={0.1}>
          <div className="code ticks">
            <div className="code-top">
              <span className="mono">terminal</span>
              <button onClick={copy} className="code-copy">
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre>
              <code>{CMD}</code>
            </pre>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function Kara() {
  return (
    <>
      <KaraHero />
      <HowItWorks />
      <Architecture />
      <Benchmark />
      <Parts />
      <Usage />
    </>
  );
}
