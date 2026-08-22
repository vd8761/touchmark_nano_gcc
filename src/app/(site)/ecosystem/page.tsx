import type { Metadata } from "next";
import Link from "next/link";
import PageOpen from "@/components/PageOpen";
import Section from "@/components/Section";
import Entries from "@/components/Entries";
import AnimatedHeading from "@/components/motion/AnimatedHeading";
import Reveal from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Ecosystem",
  description:
    "A curated network, not an open directory. Institutions, industry bodies, government partners and an advisory network across Tamil Nadu.",
};

export default function EcosystemPage() {
  return (
    <>
      <PageOpen
        index="06"
        label="Ecosystem"
        title={<>A curated network, <em>not an open directory</em>.</>}
        lede="The Nano GCC ecosystem brings together institutions, industry bodies, government partners and an advisory network across Tamil Nadu. This page gives a high-level view; two dedicated sections go deeper."
        note={{
          title: "Access",
          body: "Categories and credibility are public. Specific engagements are not.",
        }}
      />

      <Section index="07" label="Two views" note="Go deeper">
        <Entries
          items={[
            {
              n: "01",
              title: "Partners",
              body: "Institutions, industry bodies, government and innovation partners.",
              href: "/ecosystem/partners",
              go: "View partners",
            },
            {
              n: "02",
              title: "Team & Advisory",
              body: "The leadership and advisory network behind the Hub.",
              href: "/ecosystem/team",
              go: "Meet the team",
            },
          ]}
        />
      </Section>

      <Section index="08" label="Engage" tone="ink" size="lg" rule={false}>
        <AnimatedHeading as="h2" className="display d-lg">
          Want to be part of the <em>network</em>?
        </AnimatedHeading>
        <Reveal>
          <p className="body" style={{ marginTop: 22, maxWidth: "44ch" }}>
            Partnerships are shaped in direct conversation, not through open sign-up.
          </p>
          <div className="acts">
            <Link href="/contact" className="act primary">
              Talk to Touchmark
            </Link>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
