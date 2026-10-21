"use client";

import { useEffect, useState } from "react";

/** Reads Italian text with the device's built-in voice, if it has one. */
export default function SpeakButton({ text }: { text: string }) {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  if (!supported) return null;

  function speak() {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "it-IT";
    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith("it"));
    if (voice) u.voice = voice;
    u.rate = 0.9;
    synth.speak(u);
  }

  return (
    <button type="button" className="speak" onClick={speak}>
      Listen
    </button>
  );
}
