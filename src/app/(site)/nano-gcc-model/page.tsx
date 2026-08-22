import type { Metadata } from "next";
import Link from "next/link";
import PageOpen from "@/components/PageOpen";
import Section from "@/components/Section";
import Datasheet from "@/components/Datasheet";
import PullQuote from "@/components/PullQuote";
import ScaleSimulator from "@/components/ScaleSimulator";
import JourneyRail, { type Stage } from "@/components/JourneyRail";
import Figure from "@/components/Figure";
import AnimatedHeading from "@/components/motion/AnimatedHeading";
import Reveal from "@/components/motion/Reveal";
import Entries from "@/components/Entries";
import { ART } from "@/lib/images";

export const metadata: Metadata = {
  title: "The Nano GCC Model",
  description:
    "Big GCC thinking, nano-sized starting point. Size a unit from 5 to 100 professionals, prove the business case, and scale progressively.",
};

/** Unit counts climb only at the final, proven stage - the dots tell that story. */
const STAGES: Stage[] = [
  {
    kicker: "Stage one",
    title: "Rapid Innovation",
    body: "Begin with a focused idea and a team sized to test it. Nothing here is a commitment to scale - it is a commitment to find out.",
    units: 3,
  },
  {
    kicker: "Stage two",
    title: "Quick Prototyping",
    body: "Get to something real fast, while the cost of being wrong is still small. The unit is deliberately too small to defend a bad idea.",
    units: 4,
  },
  {
    kicker: "Stage three",
    title: "Validation",
    body: "Find out whether the idea holds up before the investment case is written. This is the stage the traditional route skips.",
    units: 5,
  },
  {
    kicker: "Stage four",
    title: "Faster GTM",
    body: "Move a proven concept toward market without waiting on a full build-out. Speed comes from not having built the overhead first.",
    units: 6,
  },
  {
    kicker: "Stage five",
    title: "Scale When Proven",
    body: "Grow the unit on evidence - or change direction without carrying a large cost structure. Both outcomes stay affordable.",
    units: 10,
    proven: true,
  },
];

export default function ModelPage() {
  return (
    <>
      <PageOpen
        index="03"
        label="The Nano GCC Model"
        title={
          <>
            Big GCC thinking. <em>Nano-sized</em> starting point.
          </>
        }
        lede="You don't need hundreds of employees and a major infrastructure investment to begin building capability in India. Start with a focused team, prove the business case, and scale progressively."
        note={{
          title: "Unit size",
          body: "Typically 5 to 100 professionals, sized to the requirement - never to a template.",
        }}
      />

      {/* The page's centrepiece: size a unit and watch the trade-off move. */}
      <Section index="04" label="Size a unit" note="Drag it - 5 to 100" tone="tone">
        <div style={{ maxWidth: "44ch", marginBottom: "clamp(28px, 4vw, 48px)" }}>
          <AnimatedHeading as="h2" className="display d-md">
            The unit is sized to the goal, not to a <em>template</em>.
          </AnimatedHeading>
        </div>
        <ScaleSimulator />
      </Section>

      <Section index="05" label="What you can build" note="Capability areas">
        <div className="ed-note">
          <p className="lead">Six things a unit gets built around.</p>
          <div className="hang">
            <Datasheet
              rows={[
                { k: "01", v: "AI deployment and engineering teams", m: "Engineering" },
                { k: "02", v: "Product engineering and R&D pods", m: "Product" },
                { k: "03", v: "Deep-tech development capability", m: "Deep-tech" },
                { k: "04", v: "Rapid prototyping and market validation squads", m: "Validation" },
                { k: "05", v: "Technology support functions", m: "Support" },
                { k: "06", v: "Selected back-office and operational capability", m: "Operations" },
              ]}
            />
          </div>
        </div>
      </Section>

      {/* The journey, as a sticky rail rather than a horizontal carousel. */}
      <Section index="06" label="The journey" note="Prove it before you scale it" tone="ink">
        <JourneyRail stages={STAGES} />
      </Section>

      <Section size="sm" rule={false}>
        <Figure art={ART.team} shape="wide" />
      </Section>

      <Section index="07" label="Succeed or exit" note="Either outcome stays cheap" size="lg">
        <PullQuote mark="The point of starting small">
          If it succeeds you scale it. If it doesn&rsquo;t, you change direction - without carrying
          the cost structure of a conventional setup.
        </PullQuote>
        <div className="ed-aside" style={{ marginTop: "clamp(36px, 5vw, 72px)" }}>
          <p className="body-lg measure">
            Over time, a single successful Nano GCC can grow into a larger capability center, or you
            can run multiple Nano GCC units across different goals.
          </p>
          <div className="marginal">
            <b>Scale is an outcome</b>
            Not a starting condition, and not a commitment made before the evidence exists.
          </div>
        </div>
      </Section>

      <Section index="08" label="Why Nano GCC" note="Cost / speed / risk">
        <Entries
          items={[
            {
              n: "Cost",
              title: "Lower commitment while you experiment",
              body: "Test the idea without funding a full-scale center first.",
            },
            {
              n: "Speed",
              title: "Faster access to curated capability",
              body: "The ecosystem is already mapped - you don't start from zero.",
            },
            {
              n: "Risk",
              title: "Validate before you scale the investment",
              body: "Scale on evidence, not on an upfront bet.",
            },
          ]}
        />
      </Section>

      <Section index="09" label="Engage" tone="ink" size="lg" rule={false}>
        <AnimatedHeading as="h2" className="display d-lg">
          Take the model with <em>you</em>.
        </AnimatedHeading>
        <Reveal className="acts">
          <Link href="/contact" className="act primary">
            Download the Nano GCC brochure
          </Link>
          <Link href="/for-companies" className="act">
            For companies
          </Link>
        </Reveal>
      </Section>
    </>
  );
}
