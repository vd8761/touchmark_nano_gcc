"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap, useIsoLayoutEffect, prefersReducedMotion } from "@/lib/gsap";
import { ART } from "@/lib/images";
import Stage from "./Stage";
import Counter from "./motion/Counter";
import CapabilityRotator from "./motion/CapabilityRotator";

const LINES = [
  { text: "Start small.", em: false },
  { text: "Innovate fast.", em: false },
  { text: "Build from Tamil Nadu.", em: false },
  { text: "Scale globally.", em: true },
];

export default function HeroHome() {
  const root = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el) return;

    const targets = el.querySelectorAll(".hl > span, .hero-fade");
    // Explicit final values, not clearProps: "all" - that would also strip the
    // inline colour off the emphasised line.
    const reveal = () => gsap.set(targets, { opacity: 1, y: 0, yPercent: 0, scaleX: 1 });

    // Never let an intro animation be the only thing standing between the
    // reader and the headline. A page loaded in a background tab gets no
    // requestAnimationFrame, so GSAP would apply the "from" state and never
    // animate out of it, leaving the text hidden inside its mask.
    if (prefersReducedMotion() || document.hidden) {
      reveal();
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap
        .timeline({ defaults: { ease: "expo.out" }, delay: 0.15 })
        .from(".hl > span", { yPercent: 106, duration: 1.3, stagger: 0.08 })
        .from(".hero-fade", { opacity: 0, y: 20, duration: 0.9, stagger: 0.09 }, "-=0.9");

      // Belt and braces: if the ticker never advanced, show everything anyway.
      const failsafe = window.setTimeout(() => {
        if (tl.progress() < 0.01) reveal();
      }, 4000);
      tl.eventCallback("onComplete", () => window.clearTimeout(failsafe));
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={root}>
      {/* The stage is exactly one viewport tall and the headline is capped in
          vh as well as vw, so the hero never runs off the bottom of the screen. */}
      <Stage art={ART.network} priority height="100svh" vignette className="stage-hero">
        <div className="page hero-inner">
          {/* Laid out as a drawing sheet: the headline is the drawing, ruled
              off from the copy and actions beneath it, and the unit facts run
              down a narrow title-block margin to its right. Grid areas carry
              the arrangement, so the phone can re-order the same six pieces
              into a single column without any of them being duplicated. */}
          <div className="hero-main">
            <h1 className="display d-hero hero-head">
              {LINES.map((l) => (
                <span className="hl" key={l.text}>
                  <span
                    style={{
                      fontStyle: l.em ? "italic" : undefined,
                      color: l.em ? "var(--proven)" : undefined,
                    }}
                  >
                    {l.text}
                  </span>
                </span>
              ))}
            </h1>

            <span className="hero-rule hero-fade" aria-hidden />

            <p className="body hero-copy hero-fade">
              Touchmark Nano GCC Hub helps global technology companies build agile capability in
              India - without the cost, complexity or commitment of a traditional Global Capability
              Center.
            </p>

            <div className="acts hero-acts hero-fade">
              <Link href="/nano-gcc-model" className="act primary">
                Explore the model
              </Link>
              <Link href="/contact" className="act">
                Partner with us
              </Link>
            </div>

            <div className="specs hero-meta hero-fade">
              <div className="spec">
                Unit size
                <b>
                  <Counter to={5} />–<Counter to={100} duration={2} />
                </b>
              </div>
              <div className="spec">
                Focus
                <b>One goal per unit</b>
              </div>
              <div className="spec">
                Principle
                <b>Agility over scale</b>
              </div>
              <div className="spec">
                Origin
                <b>Tamil Nadu</b>
              </div>
            </div>

            <div className="hero-rot hero-fade">
              <CapabilityRotator />
            </div>
          </div>
        </div>
      </Stage>
    </div>
  );
}
