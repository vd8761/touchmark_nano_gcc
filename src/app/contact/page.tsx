import type { Metadata } from "next";
import Link from "next/link";
import PageOpen from "@/components/PageOpen";
import Section from "@/components/Section";
import MembershipEnquiry from "@/components/MembershipEnquiry";
import AnimatedHeading from "@/components/motion/AnimatedHeading";
import Reveal from "@/components/motion/Reveal";
import { formatInrShort, PLANS } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Contact & membership",
  description:
    "Join the DOS Club as an institution, or start a conversation about a company engagement with Touchmark Nano GCC Hub.",
};

/**
 * Deliberately *not* reading `?tab=` on the server.
 *
 * Doing so would opt this page into dynamic rendering, and /contact is a
 * marketing page that should stay prerendered. The tab is picked up from the
 * URL inside MembershipEnquiry instead, in a layout effect that runs before
 * the browser paints.
 */
export default function ContactPage() {
  const plan = PLANS["institution-annual"];

  return (
    <>
      <PageOpen
        index="10"
        label="Contact & Engage"
        title={
          <>
            Join, or start a <em>conversation</em>.
          </>
        }
        lede="Institutions join the DOS Club directly. Companies tell us the capability goal they want to test, and we come back with what's realistic - commercial models and delivery detail are discussed directly rather than published."
        note={{
          title: "Two doors, one hub",
          body: "Institutions have a published membership. Company engagements are scoped individually, so those commercials are agreed on a call.",
        }}
      />

      <Section index="11" label="Membership & qualification" note="Reveal the opportunity, protect the mechanism">
        <div className="ed-split">
          <div>
            <AnimatedHeading as="h2" className="display d-md">
              Reveal the opportunity, protect the <em>mechanism</em>.
            </AnimatedHeading>

            <Reveal>
              <p className="body" style={{ marginTop: 24 }}>
                We keep operational detail &mdash; sourcing, mapping and delivery mechanics &mdash;
                out of public copy. It&rsquo;s shared in qualified conversations instead.
              </p>
            </Reveal>

            {/*
              Each <li> is a two-column grid (counter + content), so everything
              after the counter has to sit inside a single element.
            */}
            <Reveal as="ol" className="elist" stagger style={{ marginTop: 30 }}>
              <li>
                <span>
                  <strong>Institutions</strong> &mdash; DOS Club membership is{" "}
                  {formatInrShort(plan.amountPaise)} a year, inclusive of GST, paid online.
                </span>
              </li>
              <li>
                <span>
                  <strong>Companies</strong> &mdash; tell us the capability goal you want to test.
                  We&rsquo;ll arrange a call; commercials are agreed there.
                </span>
              </li>
              <li>
                <span>
                  <strong>Talent</strong> &mdash;{" "}
                  <Link href="/careers/" style={{ borderBottom: "1px solid currentColor" }}>
                    register your interest here
                  </Link>
                  .
                </span>
              </li>
              <li>
                <span>
                  <strong>Already a member?</strong> Check your status with your email or the
                  reference ID from your receipt.
                </span>
              </li>
            </Reveal>
          </div>

          <div>
            <Reveal>
              <MembershipEnquiry />
            </Reveal>
          </div>
        </div>
      </Section>
    </>
  );
}
