import type { Metadata } from "next";
import Link from "next/link";
import Stage from "@/components/Stage";
import Section from "@/components/Section";
import Datasheet from "@/components/Datasheet";
import AnimatedHeading from "@/components/motion/AnimatedHeading";
import Reveal from "@/components/motion/Reveal";
import { ART } from "@/lib/images";

export const metadata: Metadata = {
  title: "For Institutions",
  description:
    "Connect your campus to real international industry engagement - internships, MoUs, Centres of Excellence and Global Capability Center exposure for students and faculty.",
};

export default function ForInstitutionsPage() {
  return (
    <>
      <Stage art={ART.knowledge} priority height="76svh">
        <div
          className="page"
          style={{
            minHeight: "76svh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            paddingTop: 110,
            paddingBottom: "clamp(30px, 4vw, 56px)",
          }}
        >
          <div className="index" style={{ marginBottom: 18 }}>
            <b>05</b>
            <span>For Institutions</span>
          </div>
          <h1 className="display d-lg" style={{ maxWidth: "15ch" }}>
            Bring global industry opportunity to your <em>campus</em>.
          </h1>
          <p className="body" style={{ maxWidth: "52ch", marginTop: 22 }}>
            The Touchmark Nano GCC ecosystem connects institutions to real international industry
            engagement - internships, collaborations, and Global Capability Center exposure for
            students and faculty.
          </p>
        </div>
      </Stage>

      <Section index="06" label="What membership can open up" note="Opportunity areas">
        <div className="ed-note">
          <p className="lead">Real engagement, matched to your strengths.</p>
          <div className="hang">
            <Datasheet
              rows={[
                { k: "01", v: "International and international-remote internships", m: "Students" },
                { k: "02", v: "Overseas placement opportunities", m: "Students" },
                { k: "03", v: "Industry–academia MoUs", m: "Institution" },
                { k: "04", v: "Centres of Excellence and corporate-supported laboratories", m: "Institution" },
                { k: "05", v: "R&D and product-development collaborations", m: "Faculty" },
                { k: "06", v: "Access to real industry problem statements", m: "Faculty" },
              ]}
            />
          </div>
        </div>
      </Section>

      {/*
        The document is emphatic that membership is not a contact database.
        Because the page is selling access, the limit gets equal weight.
      */}
      <Section index="07" label="What membership is not" note="Stated limit" tone="tone">
        <div className="ed-split">
          <AnimatedHeading as="h2" className="display d-md">
            A facilitated relationship, <em>not a contact list</em>.
          </AnimatedHeading>
          <Reveal>
            <p className="body-lg">
              Membership connects your institution to opportunities and collaborations - it is not
              direct access to a database of overseas company contacts.
            </p>
            <p className="body" style={{ marginTop: 20 }}>
              Touchmark remains the facilitator and mapping partner throughout.
            </p>
          </Reveal>
        </div>
      </Section>

      <Section index="08" label="Engage" tone="ink" size="lg" rule={false}>
        <AnimatedHeading as="h2" className="display d-lg">
          Join the <em>ecosystem</em>.
        </AnimatedHeading>
        <Reveal>
          <p className="body" style={{ marginTop: 22, maxWidth: "44ch" }}>
            Tell us about your institution&rsquo;s strengths and we&rsquo;ll take it from there.
          </p>
          <div className="acts">
            <Link href="/contact/?tab=institution" className="act primary">
              Become a member institution
            </Link>
            <Link href="/contact/" className="act">
              Download the institution brochure
            </Link>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
