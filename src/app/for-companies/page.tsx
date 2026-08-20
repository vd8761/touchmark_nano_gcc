import type { Metadata } from "next";
import Link from "next/link";
import PageOpen from "@/components/PageOpen";
import Section from "@/components/Section";
import Figure from "@/components/Figure";
import Entries from "@/components/Entries";
import PullQuote from "@/components/PullQuote";
import AnimatedHeading from "@/components/motion/AnimatedHeading";
import Reveal from "@/components/motion/Reveal";
import { ART } from "@/lib/images";

export const metadata: Metadata = {
  title: "For Companies",
  description:
    "Build capability in India without building a large GCC from day one. We shape a Nano GCC of 5 to 100 professionals around your specific goals.",
};

export default function ForCompaniesPage() {
  return (
    <>
      <PageOpen
        index="04"
        label="For Companies"
        title={
          <>
            Build capability in India without building a large GCC from <em>day one</em>.
          </>
        }
        lede="Tell us what you're trying to build. We help you understand what's possible within Tamil Nadu's talent and innovation ecosystem, and shape a Nano GCC around your specific goals - without committing to a large-scale center upfront."
      />

      <Section size="sm" rule={false}>
        <Figure art={ART.team} shape="wide" priority />
      </Section>

      <Section index="05" label="How it works" note="Three steps">
        <Entries
          items={[
            {
              n: "01",
              title: "Share your capability goal",
              body: "AI, product, R&D, prototyping, or support functions - start with the outcome you want.",
            },
            {
              n: "02",
              title: "We scope the Nano GCC",
              body: "Sized to your requirement - typically 5 to 100 professionals.",
            },
            {
              n: "03",
              title: "Start small, then scale",
              body: "Validate first, and scale on proven outcomes rather than projections.",
            },
          ]}
        />

        {/*
          The source document is explicit that delivery mechanics stay out of
          public copy. Rather than quietly omit it, the page says so.
        */}
        <div className="ed-aside" style={{ marginTop: "clamp(36px, 5vw, 64px)" }}>
          <div />
          <div className="marginal">
            <b>Withheld by design</b>
            Operational detail on sourcing, mapping and delivery mechanics is intentionally kept out
            of public copy, and shared only in qualified conversations.
          </div>
        </div>
      </Section>

      <Section index="06" label="Principle" size="lg" tone="tone" rule={false}>
        <PullQuote mark="What we ask of you">
          Start small, validate, and scale on proven outcomes.
        </PullQuote>
      </Section>

      <Section index="07" label="Engage" tone="ink" size="lg" rule={false}>
        <AnimatedHeading as="h2" className="display d-lg">
          Let&rsquo;s scope what this looks like for <em>you</em>.
        </AnimatedHeading>
        <Reveal>
          <p className="body" style={{ marginTop: 22, maxWidth: "44ch" }}>
            A short conversation is enough to establish what&rsquo;s realistic for your goal.
          </p>
          <div className="acts">
            <Link href="/contact/?tab=organisation" className="act primary">
              Start the conversation
            </Link>
            <Link href="/contact/" className="act">
              Download the corporate brochure
            </Link>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
