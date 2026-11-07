import Hero from "./Hero";
import KaraokeScroll from "./KaraokeScroll";
import Galaxy from "./Galaxy";
import Curations from "./Curations";
import Find from "./Find";
import Pipeline from "./Pipeline";
import Features, { Closing } from "./Features";

export default function Home() {
  return (
    <>
      <Hero />
      <KaraokeScroll />
      <Galaxy />
      <Curations />
      <Find />
      <Pipeline />
      <Features />
      <Closing />
    </>
  );
}
