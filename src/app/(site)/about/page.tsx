import type { Metadata } from "next";
import Link from "next/link";
import Stage from "@/components/Stage";
import Section from "@/components/Section";
import Figure from "@/components/Figure";
import PullQuote from "@/components/PullQuote";
import AnimatedHeading from "@/components/motion/AnimatedHeading";
import Reveal from "@/components/motion/Reveal";
import { ART } from "@/lib/images";

export const metadata: Metadata = {
  title: "About & Vision",
  description:
    "Built from Tamil Nadu. Designed for the world. An agile global innovation and capability-building ecosystem - not recruitment, outsourcing or conventional GCC consulting.",
};

export default function AboutPage() {
  return (
    <>
      {/* This page opens on a photograph; the model page opens on type. */}
      <Stage art={ART.global} priority height="72svh">
        <div
          className="page"
          style={{
            minHeight: "72svh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            paddingTop: 110,
            paddingBottom: "clamp(30px, 4vw, 56px)",
          }}
        >
          <div className="index" style={{ marginBottom: 18 }}>
            <b>02</b>
            <span>About &amp; Vision</span>
          </div>
          <h1 className="display d-lg" style={{ maxWidth: "16ch" }}>
            Built from Tamil Nadu. Designed for the <em>world</em>.
          </h1>
        </div>
      </Stage>

      <Section index="03" label="The gap we close" rule={false}>
        <div className="ed-note">
          <p className="lead">Too much commitment, asked too early.</p>
          <div className="hang">
            <Reveal>
              <p className="body-lg measure">
                Global technology companies want agile access to talent and innovation capacity in
                India, but the traditional route - a full-scale Global Capability Center - asks for
                too much commitment too early.
              </p>
            </Reveal>
          </div>
        </div>
      </Section>

      <Section index="04" label="Our philosophy" size="lg">
        <PullQuote mark="Our philosophy">Agility over scale.</PullQuote>
        <div className="ed-aside" style={{ marginTop: "clamp(40px, 6vw, 80px)" }}>
          <div>
            <Reveal>
              <p className="body-lg measure">
                A company may have a promising idea but not want to spend significant time and
                capital building a large team before knowing whether the idea will work.
              </p>
              <p className="body measure" style={{ marginTop: 20 }}>
                Through the Nano GCC ecosystem, companies prototype faster, validate earlier,
                experiment with lower investment, and accelerate their go-to-market journey.
              </p>
            </Reveal>
          </div>
          <div className="marginal">
            <b>Not this</b>
            Not recruitment. Not outsourcing. Not conventional GCC consulting.
          </div>
        </div>
      </Section>

      <Section index="05" label="Our vision" tone="ink">
        <div className="ed-split">
          <div>
            <AnimatedHeading as="h2" className="display d-md">
              An ecosystem, built from Tamil Nadu, for the <em>world</em>.
            </AnimatedHeading>
          </div>
          <Reveal>
            <p className="body-lg">
              Touchmark Nano GCC Hub enables global companies to start small, innovate fast, and
              build scalable capabilities from Tamil Nadu - while creating meaningful global
              industry opportunities for the state&rsquo;s talent and institutions.
            </p>
            <p className="body" style={{ marginTop: 20 }}>
              This isn&rsquo;t recruitment, outsourcing, or conventional GCC consulting. It&rsquo;s
              an agile global innovation and capability-building ecosystem.
            </p>
          </Reveal>
        </div>
      </Section>

      <Section index="06" label="Why Tamil Nadu" note="Talent, institutions, innovation">
        <div className="ed-tall flip">
          <Figure art={ART.knowledge} shape="square" />
          <div>
            <AnimatedHeading as="h2" className="display d-md">
              Made legible, and <em>accessible</em>.
            </AnimatedHeading>
            <Reveal>
              <p className="body-lg measure" style={{ marginTop: 26 }}>
                Tamil Nadu combines a large, diverse technical talent pool with a dense network of
                engineering and research institutions, and a fast-maturing innovation ecosystem.
              </p>
              <p className="body measure" style={{ marginTop: 20 }}>
                Touchmark&rsquo;s role is to make that ecosystem legible and accessible to global
                companies - connecting the right capability to the right requirement, without either
                side having to navigate it alone.
              </p>
            </Reveal>
          </div>
        </div>
      </Section>

      <Section index="07" label="Engage" tone="ink" size="lg" rule={false}>
        <AnimatedHeading as="h2" className="display d-lg">
          See how the model works in <em>practice</em>.
        </AnimatedHeading>
        <Reveal className="acts">
          <Link href="/nano-gcc-model" className="act primary">
            Explore the Nano GCC model
          </Link>
          <Link href="/contact" className="act">
            Talk to Touchmark
          </Link>
        </Reveal>
      </Section>
    </>
  );
}
