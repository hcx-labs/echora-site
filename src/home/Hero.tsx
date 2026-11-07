import { useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowIcon, GithubIcon, LINKS } from "../components/chrome";
import "./hero.css";

const COLS = 64;

/** A wall of level meters. Pure CSS transforms, so the compositor animates it without repainting. */
function EqWall() {
  const cols = useMemo(
    () =>
      Array.from({ length: COLS }, (_, i) => ({
        variant: (i * 7) % 4,
        duration: 0.9 + ((i * 37) % 11) / 10,
        delay: -((i * 13) % 17) / 10,
        // Ice on the left, rose on the right: the sung half.
        hue: i / (COLS - 1),
      })),
    [],
  );
  return (
    <div className="eq" aria-hidden>
      <div className="eq-glow" />
      <div className="eq-cols">
        {cols.map((c, i) => (
          <i
            key={i}
            className={`v${c.variant}`}
            style={{
              animationDuration: `${c.duration}s`,
              animationDelay: `${c.delay}s`,
              background: `linear-gradient(to top, rgb(${168 + 87 * c.hue} ${206 - 63 * c.hue} ${250 - 73 * c.hue}) 0%, rgb(${168 + 87 * c.hue} ${206 - 63 * c.hue} ${250 - 73 * c.hue} / 0.15) 100%)`,
            }}
          />
        ))}
      </div>
      <div className="eq-cells" />
    </div>
  );
}

// Squares cut out of the stage's top edge, like pixels knocked out of the frame.
const NOTCHES = [3, 4, 9, 15, 16, 22, 30, 31, 38, 45, 52, 53, 60, 61, 67, 74, 81, 82, 88, 94];

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const stageY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const rise = (delay: number) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] as const },
  });
  return (
    <section className="hero" ref={ref}>
      <div className="dots" style={{ top: 120, left: "max(24px, calc(50% - 560px))" }} aria-hidden />
      <div className="dots" style={{ top: 200, right: "max(24px, calc(50% - 560px))" }} aria-hidden />
      <div className="wrap hero-copy">
        <motion.span className="marker" {...rise(0)}>
          Self-hosted · Open source
        </motion.span>
        <motion.h1 className="h-display hero-title" {...rise(0.08)}>
          Your music, listened to <span className="glow-text">closely.</span>
        </motion.h1>
        <motion.p className="lede" {...rise(0.16)}>
          Echora studies every track on your own server: how it sounds, what its lyrics say and how it relates to everything else you own.
          Then it turns that into word-timed karaoke, a galaxy of your collection, playlists in plain words and search by humming.
        </motion.p>
        <motion.div className="hero-cta" {...rise(0.24)}>
          <a className="btn btn-primary" href={LINKS.echora} target="_blank" rel="noreferrer">
            <GithubIcon /> Get Echora
          </a>
          <Link className="btn" to="/kara">
            Meet Kara <ArrowIcon />
          </Link>
        </motion.div>
      </div>
      <motion.div className="wrap hero-stage-wrap" style={{ y: stageY }} {...rise(0.32)}>
        <div className="hero-stage">
          <div className="hero-notches" aria-hidden>
            {NOTCHES.map((n) => (
              <i key={n} style={{ left: `${n}%` }} />
            ))}
          </div>
          <EqWall />
          <div className="hero-stage-bar">
            <span className="mono">00:42.180</span>
            <span className="hero-stage-label">Now analyzing · original mix</span>
            <span className="mono">03:51.000</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
