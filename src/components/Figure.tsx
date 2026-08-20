"use client";

import { useRef } from "react";
import type { Artwork } from "@/lib/images";
import { gsap, useIsoLayoutEffect, prefersReducedMotion } from "@/lib/gsap";

type Props = {
  art: Artwork;
  /** Frame proportion. */
  shape?: "wide" | "tall" | "square";
  /** Override the caption text. */
  caption?: string;
  priority?: boolean;
  className?: string;
};

/**
 * A captioned illustration.
 *
 * The art is contained rather than cropped, so it drifts gently instead of
 * being over-scaled - scaling vector art up to 1.14 would push it out of its
 * own frame and clip the figures.
 */
export default function Figure({
  art,
  shape = "wide",
  caption,
  priority = false,
  className,
}: Props) {
  const root = useRef<HTMLElement>(null);

  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el) return;

    const img = el.querySelector("img");
    if (!img) return;

    if (prefersReducedMotion()) {
      gsap.set(img, { scale: 1, yPercent: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        img,
        { yPercent: -3.5, scale: 1 },
        {
          yPercent: 3.5,
          scale: 1,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
        }
      );

      // The frame opens rather than the image fading in.
      gsap.from(el.querySelector(".fig-frame"), {
        clipPath: "inset(14% 0% 14% 0%)",
        duration: 1.3,
        ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <figure ref={root} className={`fig fig-${shape} ${className ?? ""}`}>
      <div className="fig-frame">
        <img
          src={art.src}
          alt={art.alt}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
        />
      </div>
      <figcaption>
        <span className="cap">{caption ?? art.caption}</span>
      </figcaption>
    </figure>
  );
}
