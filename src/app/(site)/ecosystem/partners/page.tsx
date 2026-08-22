import type { Metadata } from "next";
import Link from "next/link";
import PageOpen from "@/components/PageOpen";
import Section from "@/components/Section";
import Datasheet from "@/components/Datasheet";
import AnimatedHeading from "@/components/motion/AnimatedHeading";
import Reveal from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Partners",
  description:
    "A network built on trust, not a directory for sale. Curated institutional, industry, government and innovation partners across Tamil Nadu.",
};

/**
 * Categories are public; individual partners are not.
 *
 * Per the content guidance: no company named alongside what it receives from
 * the relationship, and no partner counts or growth figures that could be used
 * to reverse-engineer scale or velocity. The page therefore lists categories
 * and their status rather than inventing a logo wall.
 */
const CATEGORIES = [
  {
    k: "01",
    v: "Engineering colleges, universities and research institutions",
    m: "Under agreement",
  },
  { k: "02", v: "Industry associations and trade bodies", m: "Under agreement" },
  {
    k: "03",
    v: "State economic development and investment promotion bodies",
    m: "Not yet formalized",
  },
  { k: "04", v: "Incubators, accelerators and innovation labs", m: "Under agreement" },
  { k: "05", v: "Technology and platform partners", m: "As applicable" },
];

export default function PartnersPage() {
  return (
    <>
      <PageOpen
        index="06a"
        label="Ecosystem · Partners"
        title={
          <>
            A network built on trust, <em>not a directory for sale</em>.
          </>
        }
        lede="Touchmark works with a curated set of institutional, industry, government and innovation partners across Tamil Nadu. Categories are shown here for credibility - specific engagement details are shared only in direct, qualified conversations."
        note={{
          title: "Why no logos",
          body: "Partner identities appear only once an engagement is formalized and cleared. Nothing here stands in for a relationship that does not exist.",
        }}
      />

      <Section index="07" label="Partner categories" note="Status shown, identities withheld">
        <div className="ed-note">
          <p className="lead">Five categories. No names until they are earned.</p>
          <div className="hang">
            <Datasheet rows={CATEGORIES} />
            <Reveal>
              <p className="body" style={{ marginTop: 30, maxWidth: "56ch" }}>
                Institutional partners engage through internships, MoUs, Centres of Excellence and
                collaborative R&amp;D. Innovation partners support prototyping, validation and
                early-stage technology work. Technology partners support Nano GCC teams in
                engineering and delivery.
              </p>
            </Reveal>
          </div>
        </div>
      </Section>

      <Section index="08" label="Engage" tone="ink" size="lg" rule={false}>
        <AnimatedHeading as="h2" className="display d-lg">
          Engagement details are shared in <em>conversation</em>.
        </AnimatedHeading>
        <Reveal>
          <p className="body" style={{ marginTop: 22, maxWidth: "46ch" }}>
            If you represent an institution, association or innovation partner, start here.
          </p>
          <div className="acts">
            <Link href="/contact" className="act primary">
              Start a conversation
            </Link>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
