"use client";

import { useRef } from "react";
import { gsap, useIsoLayoutEffect, prefersReducedMotion } from "@/lib/gsap";

/** What a Nano GCC actually gets built around, per the source document. */
const ITEMS = [
  "AI deployment & engineering",
  "Product engineering & R&D",
  "Deep-tech development",
  "Rapid prototyping & validation",
  "Technology support functions",
  "Selected back-office capability",
];

const HOLD = 2.2;

/**
 * The hero's continuous animation: the capability areas cycle through a
 * masked window with a timer bar running underneath.
 *
 * Says something concrete about what the Hub builds, rather than decorating
 * the corner - and it carries the information the removed marquee used to.
 */
export default function CapabilityRotator() {
  const root = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el) return;

    const items = gsap.utils.toArray<HTMLElement>(".rotator-item", el);
    const bar = el.querySelector<HTMLElement>(".rotator-bar i");
    if (!items.length || !bar) return;

    if (prefersReducedMotion()) {
      gsap.set(items, { yPercent: 0, opacity: (i: number) => (i === 0 ? 1 : 0) });
      gsap.set(bar, { scaleX: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(items, { yPercent: 110, opacity: 0 });
      gsap.set(items[0], { yPercent: 0, opacity: 1 });

      const tl = gsap.timeline({ repeat: -1 });

      items.forEach((item, i) => {
        const next = items[(i + 1) % items.length];

        // Timer bar fills across the hold, then resets for the next item.
        tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: HOLD, ease: "none" });
        tl.to(item, { yPercent: -110, opacity: 0, duration: 0.55, ease: "power3.in" });
        tl.fromTo(
          next,
          { yPercent: 110, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.7, ease: "expo.out" },
          "<0.1"
        );
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div className="rotator" ref={root} aria-hidden>
      {/* Non-breaking space: in the hero's narrow title-block margin the label
          wraps, and "built / for" is an ugly break to leave it on. */}
      <span className="rotator-label">Nano GCC units are built&nbsp;for</span>
      <span className="rotator-window">
        {ITEMS.map((t) => (
          <span className="rotator-item" key={t}>
            {t}
          </span>
        ))}
      </span>
      <span className="rotator-bar">
        <i />
      </span>
    </div>
  );
}
