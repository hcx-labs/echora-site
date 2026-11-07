import { useEffect, useRef, useState, type ReactNode, type PointerEvent } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";

export const LINKS = {
  echora: "https://github.com/hackslashX/echora",
  kara: "https://github.com/hcx-labs/echora-kara",
  karaModel: "https://huggingface.co/hcxlabs/echora-kara-300m",
  navidrome: "https://www.navidrome.org/",
  jamendo: "https://github.com/f90/jamendolyrics",
};

/** Echora's six equalizer bars. `live` makes them breathe like a level meter. */
export function Bars({ size = 28, live = false, color = "var(--ice)" }: { size?: number; live?: boolean; color?: string }) {
  const bars = [
    [2, 10, 13],
    [6, 6, 17],
    [10, 3, 21],
    [14, 8, 15],
    [18, 5, 18],
    [22, 10, 13],
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" aria-hidden className={live ? "bars-live" : undefined}>
      {bars.map(([x, y1, y2], i) => (
        <path key={x} d={`M${x} ${y1}V${y2}`} style={{ animationDelay: `${i * -0.37}s`, transformOrigin: `${x}px 12px` }} />
      ))}
    </svg>
  );
}

export function Ambient() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const move = (e: globalThis.PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        ref.current?.style.setProperty("--mx", `${e.clientX}px`);
        ref.current?.style.setProperty("--my", `${e.clientY}px`);
      });
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);
  return (
    <div className="ambient" ref={ref} aria-hidden />
  );
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const home = pathname === "/";
  return (
    <header className={`nav${scrolled ? " scrolled" : ""}`}>
      <div className="wrap nav-inner">
        <Link to="/" className="nav-brand" aria-label="Echora home">
          <Bars size={26} live />
          Echora
        </Link>
        <nav className="nav-links" aria-label="Main">
          {home && <a className="hide-sm" href="#karaoke">Karaoke</a>}
          {home && <a className="hide-sm" href="#galaxy">Galaxy</a>}
          {home && <a className="hide-sm" href="#curations">Curations</a>}
          <NavLink to="/kara" className={({ isActive }) => `kara-link${isActive ? " active" : ""}`}>
            Kara
          </NavLink>
          <a href={LINKS.echora} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <div style={{ display: "grid", gap: 12, maxWidth: 340 }}>
          <Link to="/" className="nav-brand" style={{ color: "var(--fg)" }}>
            <Bars size={24} />
            Echora
          </Link>
          <p style={{ margin: 0 }}>A listening companion for the music you keep on your own server. Free software under the AGPL-3.0.</p>
        </div>
        <div className="footer-cols">
          <div>
            <h4>Echora</h4>
            <a href={LINKS.echora} target="_blank" rel="noreferrer">Source code</a>
            <Link to="/#features">Features</Link>
            <a href={LINKS.navidrome} target="_blank" rel="noreferrer">Navidrome</a>
          </div>
          <div>
            <h4>Kara</h4>
            <Link to="/kara">Overview</Link>
            <a href={LINKS.karaModel} target="_blank" rel="noreferrer">Model on Hugging Face</a>
            <a href={LINKS.kara} target="_blank" rel="noreferrer">Training code</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/** Fades and lifts its children into place the first time they scroll into view. */
export function Reveal({ children, delay = 0, y = 28, className, as = "div" }: { children: ReactNode; delay?: number; y?: number; className?: string; as?: "div" | "li" | "section" }) {
  const reduce = useReducedMotion();
  const M = motion[as];
  return (
    <M
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </M>
  );
}

/** A card whose border and fill light up around the pointer. */
export function GlowCard({ children, className = "", style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--cx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--cy", `${e.clientY - r.top}px`);
  };
  return (
    <div className={`gcard ${className}`} onPointerMove={onMove} style={style}>
      {children}
    </div>
  );
}

export function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

export function HfIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M8.5 10.2v.3M15.5 10.2v.3M8.2 14.2c1 1.5 2.3 2.2 3.8 2.2s2.8-.7 3.8-2.2" />
    </svg>
  );
}
