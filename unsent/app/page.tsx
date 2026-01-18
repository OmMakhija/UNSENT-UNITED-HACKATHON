"use client";

import StarField from "@/components/StarField";
import InteractiveConstellation from "@/components/InteractiveConstellation";
import LoginPage from "@/components/LoginPage";
import { MOCK_MESSAGES } from "@/data/messages";
import styles from "./landing.module.css";
import { useEffect, useState } from "react";

export default function Home() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<{ name: string, cosmicName: string } | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const progress = Math.min(scrollY / window.innerHeight, 1);
      setScrollProgress(progress);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isLoggedIn) {
    return <LoginPage onLogin={(name, cosmicName) => {
      setUserData({ name, cosmicName });
      setIsLoggedIn(true);
    }} />;
  }

  return (
    <main style={{ minHeight: "200vh" }}>
      <StarField />

      {/* Hero Section */}
      <section
        className={styles.container}
        style={{
          opacity: 1 - scrollProgress * 1.5,
          transform: `scale(${1 + scrollProgress * 0.5}) translateY(${scrollProgress * -50}px)`,
          pointerEvents: scrollProgress > 0.8 ? 'none' : 'auto',
          transition: 'opacity 0.1s, transform 0.1s'
        }}
      >
        <div className={styles.heroContent}>
          <h1 className={styles.title}>UNSENT</h1>
          <p className={styles.quote}>
            "The words you never sent are the constellations others are searching for."
          </p>

          <div className={styles.ctaWrapper}>
            <button className={styles.writeButton} onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}>
              Write Your Unsent Message
            </button>
            <div
              className={styles.exploreLink}
              onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
            >
              Or explore the constellation ↓
            </div>
          </div>
        </div>
      </section>

      {/* Constellation UI */}
      <section
        style={{
          height: "100vh",
          width: "100%",
          position: "relative",
          zIndex: 10,
          opacity: Math.max(0, (scrollProgress - 0.2)),
          pointerEvents: scrollProgress > 0.5 ? 'auto' : 'none',
          transform: `scale(${0.9 + scrollProgress * 0.1})`,
          transition: 'opacity 0.6s ease, transform 0.6s ease'
        }}
      >
        <div style={{ width: '100%', height: '100%', display: scrollProgress < 0.1 ? 'none' : 'block' }}>
          <InteractiveConstellation messages={MOCK_MESSAGES} />
        </div>
      </section>
    </main>
  );
}
