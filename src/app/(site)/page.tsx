import Link from "next/link";
import HeroHome from "@/components/HeroHome";
import Section from "@/components/Section";
import Figure from "@/components/Figure";
import AudiencePanels from "@/components/AudiencePanels";
import PullQuote from "@/components/PullQuote";
import Datasheet from "@/components/Datasheet";
import AnimatedHeading from "@/components/motion/AnimatedHeading";
import Reveal from "@/components/motion/Reveal";
import UnitDots from "@/components/motion/UnitDots";
import Counter from "@/components/motion/Counter";
import { ART } from "@/lib/images";


export default function HomePage() {
  return (
    <>
      <HeroHome />

      {/* The problem - text only, narrow lead against a wide column. */}
      <Section index="01" label="The challenge we solve" note="Stated plainly">
        <div className="ed-note">
          <p className="lead">Great ideas stall before they are ever tested.</p>
          <div className="hang">
            <Reveal>
              <p className="body-lg measure">
                Global technology companies want access to great talent and innovation capacity -
                but building a full-scale offshore center from day one is slow, expensive and risky.
              </p>
              <p className="body measure" style={{ marginTop: 20 }}>
                Most promising ideas never get the chance to be tested before a large investment is
                demanded of them.
              </p>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* Full-bleed statement over the coastline - a breath between arguments. */}
      <Section index="02" label="The philosophy" size="lg" rule={false}>
        <PullQuote mark="Agility over scale">
          A Nano GCC is a small, agile capability unit - built around one goal, and sized to prove
          it.
        </PullQuote>

        <div className="ed-aside" style={{ marginTop: "clamp(44px, 7vw, 96px)" }}>
          <Datasheet
            rows={[
              {
                k: "Size",
                v: (
                  <>
                    <Counter to={5} />–<Counter to={100} duration={2} /> professionals
                  </>
                ),
                m: "Sized to the goal",
              },
              { k: "Focus", v: "One technology, product or innovation goal", m: "Not a template" },
              { k: "Build", v: "AI deployment and engineering teams", m: "Engineering" },
              { k: "Build", v: "Product engineering and R&D pods", m: "Product" },
              { k: "Build", v: "Deep-tech development capability", m: "Deep-tech" },
              { k: "Build", v: "Rapid prototyping and market validation squads", m: "Validation" },
              { k: "Build", v: "Technology support functions", m: "Support" },
              { k: "Build", v: "Selected back-office and operational capability", m: "Operations" },
            ]}
          />
          <div>
            <div className="marginal">
              <b>Read this as a spec</b>
              A Nano GCC is defined by what you are trying to prove. Everything else - size, shape,
              duration - follows from that.
            </div>
            <Reveal className="acts">
              <Link href="/nano-gcc-model" className="act">
                See the full model
              </Link>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* The motif, on ink, full width. */}
      <Section index="03" label="Start small, scale when proven" note="1 dot = 1 professional" tone="ink">
        <div className="ed-split">
          <div>
            <AnimatedHeading as="h2" className="display d-md">
              Five people can prove what a hundred would have <em>cost you</em>.
            </AnimatedHeading>
            <Reveal>
              <p className="body" style={{ marginTop: 24, maxWidth: "40ch" }}>
                A Nano GCC begins with a focused team. Scale follows evidence - not a projection
                written before anything has been tested.
              </p>
            </Reveal>
          </div>
          <Reveal>
            <UnitDots total={100} seed={5} />
          </Reveal>
        </div>
      </Section>

      {/* Why Tamil Nadu - text beside a tall image, uneven columns. */}
      <Section index="04" label="Why Tamil Nadu" note="Origin">
        <div className="ed-tall">
          <div>
            <AnimatedHeading as="h2" className="display d-lg">
              A deep talent base, made <em>legible</em>.
            </AnimatedHeading>
            <Reveal>
              <p className="body-lg measure" style={{ marginTop: 28 }}>
                Tamil Nadu offers a deep, diverse and fast-growing talent base, strong institutional
                infrastructure, and a maturing innovation ecosystem.
              </p>
              <p className="body measure" style={{ marginTop: 20 }}>
                Touchmark connects global companies to this ecosystem - talent, institutions,
                technology capability and innovation opportunity - in a structured, curated way.
              </p>
              <div className="acts">
                <Link href="/about" className="act">
                  More about our vision
                </Link>
              </div>
            </Reveal>
          </div>
          <Figure art={ART.ideas} shape="tall" />
        </div>
      </Section>

      {/* Wide photograph of the technology corridor, full page width. */}
      <Section size="sm" rule={false}>
        <Figure art={ART.team} shape="wide" />
      </Section>

      {/* Audiences as photographic panels - scanned visually, not read as a table. */}
      <Section index="05" label="Who this is for" note="Three routes in" tone="tone">
        <AudiencePanels
          items={[
            {
              n: "01",
              title: "For Companies",
              body: "Build capability in India without a large GCC from Day One.",
              href: "/for-companies",
              cta: "Build a Nano GCC",
              art: ART.team,
            },
            {
              n: "02",
              title: "For Institutions",
              body: "Bring global industry exposure and GCC-readiness to campus.",
              href: "/for-institutions",
              cta: "Become a member",
              art: ART.ideas,
            },
            {
              n: "03",
              title: "For Talent",
              body: "Get on the radar for Nano GCC opportunities as they open.",
              href: "/careers",
              cta: "Register interest",
              art: ART.global,
            },
          ]}
        />
      </Section>

      <Section index="06" label="Engage" tone="ink" size="lg" rule={false}>
        <AnimatedHeading as="h2" className="display d-lg" >
          Ready to explore what a Nano GCC could look like for <em>you</em>?
        </AnimatedHeading>
        <Reveal className="acts">
          <Link href="/contact" className="act primary">
            Talk to Touchmark
          </Link>
          <Link href="/nano-gcc-model" className="act">
            Explore the model
          </Link>
        </Reveal>
      </Section>
    </>
  );
}
