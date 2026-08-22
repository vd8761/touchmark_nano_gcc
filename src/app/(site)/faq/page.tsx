import type { Metadata } from "next";
import Link from "next/link";
import PageOpen from "@/components/PageOpen";
import Section from "@/components/Section";
import FaqAccordion, { type Faq } from "@/components/FaqAccordion";
import AnimatedHeading from "@/components/motion/AnimatedHeading";
import Reveal from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Common questions about the Nano GCC model, institution membership, timelines, team size, scaling and cost.",
};

const FAQS: Faq[] = [
  {
    q: "How is this different from outsourcing or staffing?",
    a: "A Nano GCC is your own dedicated capability unit, built around your goals - not a shared staffing pool. It's designed to grow into your own team's extension, not a vendor relationship.",
  },
  {
    q: "What does institution membership actually include?",
    a: "Access to relevant opportunities as they arise - internships, MoUs, Centres of Excellence, R&D collaborations - matched to your institution's strengths. It is not direct access to a contact database.",
  },
  {
    q: "How quickly can a company get started?",
    a: "Timelines depend on the scope of the requirement. Start a conversation and we'll help you understand what's realistic for your specific goal.",
  },
  {
    q: "Do we have to commit to a fixed team size upfront?",
    a: "No. Nano GCCs are designed to start small - typically 5 to 100 professionals - and scale based on validated outcomes, not a fixed commitment.",
  },
  {
    q: "Can a Nano GCC grow into a full-scale GCC?",
    a: "Yes. Over time, a successful Nano GCC can scale into a larger capability center, or a company can run multiple Nano GCC units across different goals.",
  },
  {
    q: "What does it cost?",
    a: "Costs depend on team size, focus area and scope. Start a conversation with us for a proposal tailored to your requirement.",
  },
  {
    q: "Which institutions and regions are involved?",
    a: (
      <>
        The initial focus is Tamil Nadu, working with a curated set of partner institutions. See the{" "}
        <Link href="/ecosystem/partners" style={{ borderBottom: "1px solid currentColor" }}>
          Ecosystem page
        </Link>{" "}
        for partner categories.
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <>
      <PageOpen
        index="08"
        label="FAQ"
        title={<>Questions, <em>answered</em>.</>}
        lede="The things companies and institutions ask most often before starting a conversation."
      />

      <Section index="09" label="Index of questions" note={`${FAQS.length} entries`}>
        <div>
          <Reveal>
            <FaqAccordion items={FAQS} />
          </Reveal>
        </div>
      </Section>

      <Section index="10" label="Engage" tone="ink">
        <div>
          <AnimatedHeading as="h2" className="display d-lg">
            Still have a <em>question</em>?
          </AnimatedHeading>
          <Reveal>
            <p className="body" style={{ marginTop: 24 }}>
              Ask it directly - we&rsquo;ll tell you what&rsquo;s realistic for your situation.
            </p>
            <div className="acts">
              <Link href="/contact" className="act primary">
                Talk to Touchmark
              </Link>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
