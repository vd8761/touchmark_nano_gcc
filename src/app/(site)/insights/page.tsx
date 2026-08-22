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
  title: "Insights & Stories",
  description:
    "Perspectives on agile global capability - GCC trends, AI deployment, Tamil Nadu's innovation ecosystem, and anonymized success stories.",
};

export default function InsightsPage() {
  return (
    <>
      <PageOpen
        index="07"
        label="Insights & Stories"
        title={
          <>
            Perspectives on agile global <em>capability</em>.
          </>
        }
        lede="A running set of short, credible articles and anonymized stories that build authority - without exposing how the ecosystem actually operates."
      />

      <Section index="08" label="Content pillars" note="Five running threads">
        <Entries
          items={[
            {
              n: "01",
              title: "Why smaller units are gaining traction",
              body: "What's changing in the Global Capability Center model, and why scale is no longer the starting point.",
            },
            {
              n: "02",
              title: "AI hiring and deployment trends",
              body: "What global technology teams are learning about building AI capability offshore.",
            },
            {
              n: "03",
              title: "Inside Tamil Nadu's technology ecosystem",
              body: "Talent, institutions and infrastructure - what the ecosystem actually offers.",
            },
            {
              n: "04",
              title: "Validating before scaling a team",
              body: "Approaches to proving an idea works before the investment case is written.",
            },
            {
              n: "05",
              title: "Industry–academia collaboration models",
              body: "What works when campuses and global companies build together.",
            },
          ]}
        />
      </Section>

      <Section size="sm" rule={false}>
        <Figure art={ART.global} shape="wide" />
      </Section>

      {/* Anonymization is a rule from the source document, so it is stated. */}
      <Section index="09" label="Success stories" note="Always anonymized" tone="tone">
        <div className="ed-note">
          <p className="lead">No names. No traceable numbers.</p>
          <div className="hang">
            <Reveal>
              <p className="body-lg measure">
                No client names, no identifying details, no numbers precise enough to be traced
                back. Each story follows the same short structure: the starting point, the approach
                described generically, and the outcome in relative terms.
              </p>
            </Reveal>
          </div>
        </div>
      </Section>

      <Section index="10" label="Example - illustrative only" note="Not a specific client" size="lg">
        <PullQuote mark="Illustrative">
          A US-based AI company validated a new product line with a small, focused Nano GCC - moving
          from prototype to market-ready in a few months, and scaling on proven results.
        </PullQuote>
      </Section>

      <Section index="11" label="Engage" tone="ink" size="lg" rule={false}>
        <AnimatedHeading as="h2" className="display d-lg">
          More stories, as they are <em>cleared</em>.
        </AnimatedHeading>
        <Reveal>
          <p className="body" style={{ marginTop: 22, maxWidth: "48ch" }}>
            Every story is anonymized before it goes out. Ask us what&rsquo;s relevant to your
            sector.
          </p>
          <div className="acts">
            <Link href="/contact" className="act primary">
              Read more stories
            </Link>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
