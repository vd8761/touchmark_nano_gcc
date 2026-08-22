import type { Metadata } from "next";
import Link from "next/link";
import PageOpen from "@/components/PageOpen";
import Section from "@/components/Section";
import Entries from "@/components/Entries";
import AnimatedHeading from "@/components/motion/AnimatedHeading";
import Reveal from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Team & Advisory",
  description:
    "The leadership team and advisory councils that provide strategic oversight and validation for the Touchmark Nano GCC ecosystem.",
};

/**
 * Every group reads as strategic oversight, not an operational contact.
 * Names and details of the sourcing, delivery and account-management team stay
 * internal, in line with the ecosystem's information protection principle.
 *
 * The "Government & Policy Liaison" group is deliberately absent - the content
 * guidance holds it back until a formal relationship with Tamil Nadu's economic
 * development bodies is confirmed.
 */
const GROUPS = [
  {
    n: "01",
    title: "Core leadership",
    body: "Founder and director level. Bios focused on vision, background and track record - not day-to-day operational role. 2–4 profiles.",
  },
  {
    n: "02",
    title: "Industry advisory council",
    body: "Overseas technology leaders, former GCC heads and senior product or AI executives who advise on the model. 3–5 members.",
  },
  {
    n: "03",
    title: "Academic advisory board",
    body: "Vice-chancellors, deans and senior faculty from anchor partner institutions. 3–5 members.",
  },
  {
    n: "04",
    title: "Innovation & technology committee",
    body: "Domain experts across AI, deep-tech and product who help define what “Nano GCC ready” means. 3–6 members.",
  },
];

export default function TeamPage() {
  return (
    <>
      <PageOpen
        index="06b"
        label="Ecosystem · Team & Advisory"
        title={
          <>
            The people <em>behind</em> the Hub.
          </>
        }
        lede="Touchmark Nano GCC Hub is guided by a small leadership team and a set of advisory councils that bring industry, academic and innovation credibility to the ecosystem. These groups provide strategic oversight and validation - not operational points of contact."
        note={{
          title: "Oversight only",
          body: "The sourcing, delivery and account-management team is not listed here, by design.",
        }}
      />

      <Section index="07" label="Groups" note="Profiles added as confirmed">
        <Entries items={GROUPS} />
        <div className="ed-aside" style={{ marginTop: "clamp(36px, 5vw, 62px)" }}>
          <div />
          <div className="marginal">
            <b>Held back</b>
            A government and policy liaison would strengthen institutional trust. That section stays
            unpublished until the relationship is formally confirmed.
          </div>
        </div>
      </Section>

      <Section index="08" label="Engage" tone="ink" size="lg" rule={false}>
        <AnimatedHeading as="h2" className="display d-lg">
          Questions for the <em>Hub</em>?
        </AnimatedHeading>
        <Reveal>
          <p className="body" style={{ marginTop: 22, maxWidth: "46ch" }}>
            Advisory members provide oversight; day-to-day conversations start here.
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
