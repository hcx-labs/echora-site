import { Link } from "react-router-dom";
import { ArrowIcon, Bars, GithubIcon, GlowCard, LINKS, Reveal } from "../components/chrome";
import "./features.css";

const FEATURES: { title: string; text: string; icon: string }[] = [
  { icon: "M4 5h16M4 12h10M4 19h7M17 15l3 3-3 3", title: "Translations", text: "Connect any OpenAI-compatible model and lyrics are translated line by line, each line kept with its timing." },
  { icon: "M12 3v4M5.6 5.6l2.8 2.8M3 12h4M18.4 5.6l-2.8 2.8M21 12h-4M8 18a4 4 0 0 1 8 0", title: "Lyrics for songs without", text: "For vocal tracks with no lyrics, an optional transcription model listens to the isolated vocals and writes them out." },
  { icon: "M3 17l4-8 4 5 3-3 4 6M3 21h18", title: "Things to watch", text: "Audio-reactive visualizers, a waveform of the whole track, a melody line, and on a capable GPU, a looping animation made from each cover." },
  { icon: "M4 12h4l2-6 4 12 2-6h4", title: "Navidrome plugin", text: "Sonic similarity, artist radio and Echora's timed, translated lyrics, inside Navidrome's own apps through per-account keys." },
  { icon: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20a6 6 0 0 1 12 0M17 11a3 3 0 1 0 0-6M22 20a6 6 0 0 0-4-5.6", title: "Several listeners", text: "Sign in through your OpenID Connect provider. A track two people own is analyzed once and shared." },
  { icon: "M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4Z", title: "Your files stay yours", text: "Navidrome keeps hosting and streaming. Echora never modifies your files, has no catalog and no recommendation service." },
];

export default function Features() {
  return (
    <section className="section features" id="features">
      <div className="wrap">
        <div className="section-head">
          <Reveal delay={0.05}>
            <span className="marker">And more</span>
            <h2 className="h-section">
              Everything it suggests comes from <span className="glow-text">your own library.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="lede">Echora has no catalog of its own. Every recommendation, playlist and search result is drawn from the files already on your server.</p>
          </Reveal>
        </div>
        <div className="feat-grid">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.06}>
              <GlowCard className="feat">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="feat-icon">
                  <path d={f.icon} />
                </svg>
                <h3 className="h-card">{f.title}</h3>
                <p className="muted">{f.text}</p>
              </GlowCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Closing() {
  return (
    <section className="section closing">
      <div className="closing-glow" aria-hidden />
      <div className="wrap closing-inner">
        <Reveal>
          <div className="closing-bars">
            <Bars size={120} live />
          </div>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="h-display" style={{ fontSize: "clamp(40px, 6vw, 84px)" }}>
            Hear your library <span className="glow-text">in a new light.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="lede">Echora runs on your server with Docker and an NVIDIA GPU, next to the Navidrome you already have. Free and open source.</p>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="hero-cta" style={{ justifyContent: "center" }}>
            <a className="btn btn-primary" href={LINKS.echora} target="_blank" rel="noreferrer">
              <GithubIcon /> Get Echora on GitHub
            </a>
            <Link className="btn" to="/kara">
              Meet Kara <ArrowIcon />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
