import { useEffect, useMemo, useRef } from "react";
import { useInView } from "motion/react";
import { Link } from "react-router-dom";
import { ArrowIcon, Reveal } from "../components/chrome";
import "./karaoke.css";

type Unit = { text: string; ruby?: string; ms: number };
type Line = { lang: string; label: string; dir?: "rtl"; className?: string; units: Unit[]; translation?: string; gap?: string };

// Original lines written for this page. Each unit is one sung syllable (a mora for Japanese,
// a block for Korean, a word for Urdu so its letters stay joined) with its duration.
const LINES: Line[] = [
  {
    lang: "en",
    label: "English",
    units: [
      { text: "Hold ", ms: 420 },
      { text: "the ", ms: 220 },
      { text: "light ", ms: 520 },
      { text: "a ", ms: 200 },
      { text: "lit", ms: 260 },
      { text: "tle ", ms: 260 },
      { text: "long", ms: 380 },
      { text: "er", ms: 640 },
    ],
  },
  {
    lang: "ja",
    label: "Japanese · filled mora by mora",
    className: "ja",
    gap: "",
    units: [
      { text: "夜", ruby: "よる", ms: 560 },
      { text: "を", ms: 260 },
      { text: "越", ruby: "こ", ms: 300 },
      { text: "え", ms: 260 },
      { text: "て", ms: 300 },
      { text: "歌", ruby: "うた", ms: 520 },
      { text: "お", ms: 280 },
      { text: "う", ms: 620 },
    ],
    translation: "Let's sing on through the night",
  },
  {
    lang: "ko",
    label: "Korean",
    className: "ko",
    units: [
      { text: "너", ms: 280 },
      { text: "의 ", ms: 300 },
      { text: "목", ms: 260 },
      { text: "소", ms: 240 },
      { text: "리", ms: 240 },
      { text: "가 ", ms: 320 },
      { text: "들", ms: 280 },
      { text: "려", ms: 320 },
      { text: "와", ms: 640 },
    ],
    translation: "Your voice reaches me",
  },
  {
    lang: "ur",
    label: "Urdu · right to left",
    dir: "rtl",
    className: "ur",
    units: [
      { text: "رات ", ms: 520 },
      { text: "کے ", ms: 300 },
      { text: "ساتھ ", ms: 520 },
      { text: "گاتے ", ms: 560 },
      { text: "چلو", ms: 760 },
    ],
    translation: "Keep singing along with the night",
  },
  {
    lang: "en",
    label: "English",
    units: [
      { text: "Ev", ms: 240 },
      { text: "ery ", ms: 240 },
      { text: "word ", ms: 420 },
      { text: "lands ", ms: 420 },
      { text: "where ", ms: 300 },
      { text: "it's ", ms: 260 },
      { text: "sung", ms: 900 },
    ],
  },
];

const LINE_GAP_MS = 700;

function timeline() {
  let t = 300;
  return LINES.map((line) => {
    const units = line.units.map((u) => {
      const start = t;
      t += u.ms;
      return { ...u, start, end: t };
    });
    const span = { start: units[0].start, end: t };
    t += LINE_GAP_MS;
    return { ...line, units, ...span };
  });
}

function fmt(ms: number) {
  const s = Math.max(0, ms) / 1000;
  return `00:${s.toFixed(3).padStart(6, "0")}`;
}

export default function KaraokeScroll() {
  const lines = useMemo(timeline, []);
  const total = lines[lines.length - 1].end + 600;
  const section = useRef<HTMLElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const clock = useRef<HTMLSpanElement>(null);
  const unitLabel = useRef<HTMLSpanElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const bars = useMemo(
    () =>
      Array.from({ length: 120 }, (_, i) => {
        const t = (i / 120) * total;
        const singing = lines.some((l) => t >= l.start && t <= l.end);
        return 0.18 + (singing ? 0.5 : 0.12) * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.43)) + (singing ? 0.2 : 0);
      }),
    [lines, total],
  );

  // Plays in real time while the stage is on screen, then holds a beat and loops.
  const inView = useInView(section, { margin: "-15% 0px" });
  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const loop = total + 1800;
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      render(Math.min(total, (t - start) % loop));
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, total]);

  function render(now: number) {
    const p = now / total;
    const root = list.current;
    if (!root) return;
    let active = 0;
    lines.forEach((line, li) => {
      if (now >= line.start - LINE_GAP_MS / 2) active = li;
      line.units.forEach((u, ui) => {
        const el = root.querySelector<HTMLElement>(`[data-u="${li}-${ui}"]`);
        const fill = Math.min(1, Math.max(0, (now - u.start) / (u.end - u.start)));
        el?.style.setProperty("--p", `${(fill * 100).toFixed(1)}%`);
      });
    });
    root.querySelectorAll<HTMLElement>(".k-line").forEach((el, i) => {
      el.dataset.state = i === active ? "active" : i < active ? "past" : "next";
    });
    const activeEl = root.querySelectorAll<HTMLElement>(".k-line")[active];
    if (activeEl) {
      const offset = activeEl.offsetTop + activeEl.offsetHeight / 2;
      root.style.transform = `translateY(${-offset}px)`;
    }
    if (clock.current) clock.current.textContent = fmt(now);
    const line = lines[active];
    const unit = line.units.find((u) => now >= u.start && now < u.end);
    if (unitLabel.current) unitLabel.current.textContent = unit ? `${(unit.ruby ?? unit.text).trim()} · ${Math.round(unit.start)} ms` : "between lines";
    head.current?.style.setProperty("--head", `${(p * 100).toFixed(2)}%`);
  }

  return (
    <section className="section karaoke" id="karaoke" ref={section}>
      <div className="karaoke-sticky">
        <div className="wrap karaoke-grid">
          <div className="karaoke-copy">
            <Reveal delay={0.05}>
              <span className="marker rose">Karaoke</span>
              <h2 className="h-section">
                Every syllable, <span className="rose-text">right as it's sung.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="lede">
                Echora times each syllable with its own alignment model, trained on singing in many languages, and lights
                the words as the voice reaches them. Furigana fills mora by mora, Urdu fills right to left, and translations stay paired
                with their lines.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <Link to="/kara" className="btn">
                How Kara times it <ArrowIcon />
              </Link>
            </Reveal>
          </div>
          <div className="karaoke-stage" aria-label="Karaoke demo">
            <div className="stage-top">
              <span className="stage-tab">Lyrics</span>
              <span className="stage-readout mono">
                <span ref={unitLabel}>scroll to start</span>
              </span>
            </div>
            <div className="k-window">
              <div className="k-list" ref={list}>
                {lines.map((line, li) => (
                  <div className={`k-line ${line.className ?? ""}`} key={li} data-state={li === 0 ? "active" : "next"} lang={line.lang} dir={line.dir}>
                    <span className="k-label mono">{line.label}</span>
                    <p className="k-text">
                      {line.units.map((u, ui) => (
                        <span className="syl" data-u={`${li}-${ui}`} key={ui}>
                          {u.ruby ? (
                            <ruby>
                              <span className="fill">{u.text}</span>
                              <rt>
                                <span className="fill">{u.ruby}</span>
                              </rt>
                            </ruby>
                          ) : (
                            <span className="fill">{u.text}</span>
                          )}
                        </span>
                      ))}
                    </p>
                    {line.translation && <span className="k-translation" lang="en" dir="ltr">{line.translation}</span>}
                  </div>
                ))}
              </div>
            </div>
            <div className="k-transport">
              <span className="mono k-clock" ref={clock}>
                00:00.000
              </span>
              <div className="k-wave" aria-hidden ref={head}>
                {[0, 1].map((layer) => (
                  <div className={layer ? "k-bars played" : "k-bars"} key={layer}>
                    {bars.map((h, i) => (
                      <i key={i} style={{ height: `${h * 100}%` }} />
                    ))}
                  </div>
                ))}
                <div className="k-head" />
              </div>
              <span className="mono k-src">original mix</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
