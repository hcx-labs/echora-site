import { useEffect, useMemo, useRef, useState } from "react";
import { useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { Reveal } from "../components/chrome";
import "./galaxy.css";

type View = "semantic" | "acoustic" | "lyrics";
const VIEWS: { id: View; name: string; basis: string; communities: string[] }[] = [
  { id: "semantic", name: "Semantic", basis: "Musical meaning: style, mood, vocals and instrumentation", communities: ["piano ballads", "bright synth-pop", "j-rock", "acoustic folk", "late-night r&b", "orchestral swells", "festival edm"] },
  { id: "acoustic", name: "Acoustic", basis: "The recorded sound itself: timbre, rhythm and production", communities: ["wide reverb", "punchy drums", "soft dynamics", "dense guitars", "four on the floor", "close vocals", "lo-fi texture"] },
  { id: "lyrics", name: "Lyrics", basis: "What the songs are about", communities: ["heartbreak", "leaving home", "summer nights", "self-doubt", "devotion", "rebellion", "growing up"] },
];
const HUES = ["#a8cefa", "#ff8fb1", "#8ff0d2", "#ffc98a", "#c4a8ff", "#7fb6ff", "#ff9d7a"];
const K = 7;

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function useStars(n: number) {
  return useMemo(() => {
    const r = rng(7);
    const gauss = () => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());
    const centers = VIEWS.map(() =>
      Array.from({ length: K }, (_, k) => {
        const a = (k / K) * Math.PI * 2 + r() * 0.6;
        const d = 0.22 + r() * 0.16;
        return { x: 0.5 + Math.cos(a) * d * 1.25, y: 0.5 + Math.sin(a) * d };
      }),
    );
    return Array.from({ length: n }, () => {
      const a = Math.floor(r() * K);
      // Neighbours in one space are often, not always, neighbours in another.
      const b = r() < 0.55 ? (a + 1) % K : Math.floor(r() * K);
      const c = r() < 0.4 ? a : Math.floor(r() * K);
      const spread = 0.045 + r() * 0.03;
      const pos = [a, b, c].map((k, v) => ({ x: centers[v][k].x + gauss() * spread * 1.2, y: centers[v][k].y + gauss() * spread }));
      return { cluster: [a, b, c], pos, size: 1 + Math.pow(r(), 3) * 2.6, tw: r() * 6.28 };
    });
  }, [n]);
}

export default function Galaxy() {
  const stars = useStars(560);
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState(0); // 0..2 views, 3 journey
  const journeyRef = useRef(0);
  const stageRef = useRef(0);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const s = Math.min(3, Math.floor(p * 4.2));
    stageRef.current = s;
    journeyRef.current = Math.min(1, Math.max(0, (p - 0.7) / 0.25));
    setStage(s);
  });

  const journey = useMemo(() => {
    // A path through the semantic space, from one community to one across the map.
    const view = 0;
    const from = stars.findIndex((s) => s.cluster[0] === 1);
    const to = stars.findIndex((s) => s.cluster[0] === 4);
    const path = [from];
    let cur = from;
    for (let step = 0; step < 9; step++) {
      const target = stars[to].pos[view];
      const here = stars[cur].pos[view];
      const left = Math.hypot(target.x - here.x, target.y - here.y);
      if (left < 0.03) break;
      let best = -1;
      let bestScore = Infinity;
      stars.forEach((s, i) => {
        if (path.includes(i)) return;
        const p = s.pos[view];
        const hop = Math.hypot(p.x - here.x, p.y - here.y);
        const remaining = Math.hypot(target.x - p.x, target.y - p.y);
        if (hop < 0.02 || hop > left / 2.2 + 0.04) return;
        const score = remaining + Math.abs(hop - left / (9 - step)) * 0.8;
        if (score < bestScore) {
          bestScore = score;
          best = i;
        }
      });
      if (best < 0) break;
      path.push(best);
      cur = best;
    }
    path.push(to);
    return path;
  }, [stars]);

  useEffect(() => {
    const c = canvas.current!;
    const ctx = c.getContext("2d")!;
    const live = stars.map((s) => ({ x: s.pos[0].x, y: s.pos[0].y }));
    let raf = 0;
    let visible = false;
    let labelAlpha = 1;
    let lastView = 0;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(c);
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const r = c.getBoundingClientRect();
      c.width = r.width * dpr;
      c.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible) return;
      const { width: w, height: h } = c.getBoundingClientRect();
      // On wide screens the copy sits on the left of the 1200px frame, so the map fills the frame's
      // right side and stops short of its edge, leaving room for the community labels.
      const frame = Math.min(w, 1200);
      const left = (w - frame) / 2;
      const X = (x: number) => (w > 900 ? left + frame * (0.3 + x * 0.6) : (0.1 + x * 0.8) * w);
      const view = Math.min(2, stageRef.current) as 0 | 1 | 2;
      const journeyView = stageRef.current === 3;
      const v = journeyView ? 0 : view;
      if (v !== lastView) {
        labelAlpha = 0;
        lastView = v;
      }
      labelAlpha = Math.min(1, labelAlpha + 0.02);
      const t = reduce ? 0 : now / 1000;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      const ease = reduce ? 1 : 0.06;
      stars.forEach((s, i) => {
        const target = s.pos[v];
        const p = live[i];
        p.x += (target.x - p.x) * ease;
        p.y += (target.y - p.y) * ease;
        const x = X(p.x);
        const y = p.y * h;
        const hue = HUES[s.cluster[v]];
        const onPath = journeyView && journey.includes(i);
        const dim = journeyView && !onPath ? 0.35 : 1;
        const tw = 0.65 + 0.35 * Math.sin(t * 1.4 + s.tw);
        // Square stars: a faint halo square and a bright core, no gradients.
        const r = s.size * (onPath ? 2 : 1);
        ctx.fillStyle = hue;
        ctx.globalAlpha = 0.12 * tw * dim;
        ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
        ctx.globalAlpha = 0.9 * tw * dim;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
        ctx.fillStyle = "#fff";
        ctx.fillRect(x - r * 0.45, y - r * 0.45, r * 0.9, r * 0.9);
      });
      ctx.globalAlpha = 1;
      // Journey
      const jp = journeyRef.current;
      if (journeyView && jp > 0) {
        const pts = journey.map((i) => ({ x: X(live[i].x), y: live[i].y * h }));
        const segs = pts.length - 1;
        const upto = jp * segs;
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255,226,236,0.9)";
        ctx.shadowColor = "#ff8fb1";
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let k = 1; k <= Math.ceil(upto); k++) {
          const f = Math.min(1, upto - (k - 1));
          const a = pts[k - 1];
          const b = pts[k];
          ctx.lineTo(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        pts.forEach((pt, k) => {
          if (k > upto + 0.001) return;
          ctx.fillStyle = k === 0 || k === segs ? "#ff8fb1" : "#ffe2ec";
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, k === 0 || k === segs ? 6 : 3.5, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      ctx.globalCompositeOperation = "source-over";
      // Community labels
      if (!journeyView) {
        ctx.font = "600 12px 'JetBrains Mono Variable', monospace";
        ctx.textAlign = "center";
        VIEWS[v].communities.forEach((name, k) => {
          const members = stars.filter((s) => s.cluster[v] === k);
          const cx = members.reduce((a, s) => a + s.pos[v].x, 0) / members.length;
          const cy = Math.min(...members.map((s) => s.pos[v].y));
          ctx.globalAlpha = labelAlpha * 0.85;
          ctx.fillStyle = HUES[k];
          ctx.fillText(name, X(cx), cy * h - 8);
        });
        ctx.globalAlpha = 1;
      }
    };
    resize();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [stars, journey, reduce]);

  const goTo = (s: number) => {
    const el = section.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const range = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + range * ((s + 0.5) / 4.2), behavior: "smooth" });
  };

  const view = VIEWS[Math.min(2, stage)];
  return (
    <section className="galaxy" id="galaxy" ref={section}>
      <div className="galaxy-sticky">
        <canvas ref={canvas} className="galaxy-canvas" aria-label="An animated map of a music library: tracks drawn as coloured stars grouped into communities." />
        <div className="wrap galaxy-overlay">
          <div className="galaxy-copy">
            <Reveal delay={0.05}>
              <span className="marker">Galaxy</span>
              <h2 className="h-section">
                Every track a star, close to the ones it <span className="glow-text">resembles.</span>
              </h2>
            </Reveal>
            <div className="galaxy-tabs" role="tablist" aria-label="Galaxy view">
              {VIEWS.map((v, i) => (
                <button key={v.id} role="tab" aria-selected={stage === i} className={stage === i ? "on" : undefined} onClick={() => goTo(i)}>
                  {v.name}
                </button>
              ))}
              <button role="tab" aria-selected={stage === 3} className={stage === 3 ? "on rose" : "rose"} onClick={() => goTo(3)}>
                Sonic journey
              </button>
            </div>
            <p className="galaxy-basis">
              {stage < 3 ? (
                <>
                  <b>{view.name}.</b> {view.basis}. Tracks gather into communities you can inspect, each with the concepts that describe it.
                </>
              ) : (
                <>
                  <b>Sonic journey.</b> Pick two songs and Echora plays a path that moves gradually from one to the other. Rankings and
                  journeys use the full vectors, not distances on the screen.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
