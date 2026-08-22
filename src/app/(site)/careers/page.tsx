import type { Metadata } from "next";
import PageOpen from "@/components/PageOpen";
import Section from "@/components/Section";
import EnquiryForm from "@/components/EnquiryForm";
import AnimatedHeading from "@/components/motion/AnimatedHeading";
import Reveal from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Careers & Talent",
  description:
    "Register your interest to be considered for Nano GCC opportunities across AI, product engineering, R&D and deep-tech as they open up.",
};

export default function CareersPage() {
  return (
    <>
      <PageOpen
        index="09"
        label="Careers & Talent"
        title={<>Get on the radar for global <em>opportunities</em>.</>}
        lede="Nano GCC teams are being built across AI, product engineering, R&D and deep-tech. Register your interest to be considered as opportunities open up through the ecosystem."
        note={{
          title: "Be clear on this",
          body: "This is a pipeline, not a job board. No placement is guaranteed.",
        }}
      />

      <Section index="10" label="Register your interest" note="Talent pipeline">
        <div className="ed-split">
        <div>
          <AnimatedHeading as="h2" className="display d-md">
            A pipeline, <em>not a job board</em>.
          </AnimatedHeading>
          <Reveal as="ol" className="elist" stagger style={{ marginTop: 30 }}>
            <li>Tell us your area of expertise and interest</li>
            <li>We match profiles against live Nano GCC requirements as they arise</li>
            <li>No guaranteed placement - this is a pipeline, not a job board</li>
          </Reveal>
        </div>

        <div>
          <Reveal>
            <EnquiryForm
              submitLabel="Register your interest"
              successMessage="Registered. We'll reach out if a matching Nano GCC requirement opens up."
              fields={[
                { kind: "text", name: "name", label: "Name", required: true, placeholder: "Your full name" },
                { kind: "text", name: "email", label: "Email", type: "email", required: true, placeholder: "you@email.com" },
                {
                  kind: "select",
                  name: "area",
                  label: "Area of expertise",
                  required: true,
                  options: [
                    "AI & machine learning",
                    "Product engineering",
                    "R&D",
                    "Deep-tech",
                    "Technology support",
                    "Other",
                  ],
                },
                { kind: "textarea", name: "message", label: "Tell us about your interest", placeholder: "Where you have worked, what you would want to build" },
              ]}
            />
          </Reveal>
        </div>
        </div>
      </Section>
    </>
  );
}
