"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NAV } from "@/lib/nav";
import { gsap, ScrollTrigger, useIsoLayoutEffect } from "@/lib/gsap";

import Logo from "./Logo";

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const barRef = useRef<HTMLSpanElement>(null);

  // These pages open on a full-bleed photograph, so the header sits on the
  // image and needs to be white until it becomes solid. Every other page opens
  // on paper and keeps the ink colour.
  const STAGE_PAGES = ["/", "/about", "/for-institutions"];
  const overImage = STAGE_PAGES.includes(pathname.replace(/\/$/, "") || "/");

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useIsoLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const st = ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => gsap.set(bar, { scaleX: self.progress }),
    });
    return () => st.kill();
  }, [pathname]);

  const isOn = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={`head${solid ? " solid" : ""}${overImage ? " over-image" : ""}${
        open ? " nav-open" : ""
      }`}
    >
      <div className="head-in">
        <Link href="/" className="brand" aria-label="Touchmark Nano GCC Hub - home">
          {/* The bar is white type only while it sits on a navy stage; once it
              goes solid over the light page - or the index panel puts a light
              surface behind it - the colour lockup is the legible one. */}
          <Logo variant={overImage && !solid && !open ? "white" : "color"} />
          <span className="brand-txt">Nano GCC Hub</span>
        </Link>

        <button
          className="burger"
          type="button"
          aria-expanded={open}
          aria-controls="primary-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Index"}
        </button>

        <nav id="primary-nav" className={`nav${open ? " open" : ""}`} aria-label="Primary">
          {NAV.map((item) =>
            item.sub ? (
              <span className="has-sub" key={item.href}>
                <Link href={item.href} className={isOn(item.href) ? "on" : undefined}>
                  {item.label}
                </Link>
                <span className="sub">
                  {item.sub.map((s) => (
                    <Link key={s.href} href={s.href} className={pathname === s.href ? "on" : undefined}>
                      {s.label}
                    </Link>
                  ))}
                </span>
              </span>
            ) : (
              <Link key={item.href} href={item.href} className={isOn(item.href) ? "on" : undefined}>
                {item.label}
              </Link>
            )
          )}

          {/* The header CTA is hidden on small screens, so Contact would
              otherwise be unreachable from the bar. It rides at the foot of
              the open index instead. */}
          <Link href="/contact" className="act primary nav-cta">
            Start a conversation
          </Link>
        </nav>

        <Link href="/contact" className="act primary head-cta" style={{ padding: "10px 16px" }}>
          Start a conversation
        </Link>
      </div>
      <span className="progress" ref={barRef} aria-hidden />
    </header>
  );
}
