import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Ambient, Footer, Nav } from "./components/chrome";
import Home from "./home/Home";
import Kara from "./kara/Kara";

function ScrollOnNavigate() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView();
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = pathname === "/kara" ? "Echora Kara" : "Echora";
  }, [pathname]);
  return (
    <>
      <ScrollOnNavigate />
      <Ambient />
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/kara" element={<Kara />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
