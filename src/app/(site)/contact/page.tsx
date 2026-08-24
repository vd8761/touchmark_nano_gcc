import type { Metadata } from "next";
import Link from "next/link";
import PageOpen from "@/components/PageOpen";
import Section from "@/components/Section";
import MembershipEnquiry from "@/components/MembershipEnquiry";
import AnimatedHeading from "@/components/motion/AnimatedHeading";
import Reveal from "@/components/motion/Reveal";
import { formatInrShort, PLANS } from "@/lib/pricing";
import { getCurrentQuote } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Contact & membership",
  description:
    "Join as an institution, or start a conversation about a company engagement with Touchmark Nano GCC Hub.",
};

/**
 * Revalidated rather than fully dynamic: the price is admin-configurable
 * (see /admin/settings) and this page quotes it in both marketing copy and
 * the form below, so it can't be a build-time constant - but /contact should
 * still mostly behave like a prerendered marketing page rather than render
 * on every single request. A minute-old price is an acceptable trade-off;
 * the actual charge at checkout always reads the live value regardless.
 */
export const revalidate = 60;

/**
 * Deliberately *not* reading `?tab=` on the server.
 *
 * Doing so would opt this page into fully dynamic rendering. The tab is
 * picked up from the URL inside MembershipEnquiry instead, in a layout
 * effect that runs before the browser paints.
 */
export default async function ContactPage() {
  const plan = PLANS["institution-annual"];
  const quote = await getCurrentQuote(plan.id);

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
        lede="Institutions join Nano GCC directly. Companies tell us the capability goal they want to test, and we come back with what's realistic - commercial models and delivery detail are discussed directly rather than published."
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
                We keep operational detail - sourcing, mapping and delivery mechanics -
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
                  <strong>Institutions</strong> - Nano GCC membership is{" "}
                  {formatInrShort(quote.listedPaise)} a year,{" "}
                  {quote.priceIncludesGst
                    ? "inclusive of GST"
                    : `plus ${Math.round(quote.gstRate * 100)}% GST (${formatInrShort(quote.totalPaise)} in total)`}
                  , paid online.
                </span>
              </li>
              <li>
                <span>
                  <strong>Companies</strong> - tell us the capability goal you want to test.
                  We&rsquo;ll arrange a call; commercials are agreed there.
                </span>
              </li>
              <li>
                <span>
                  <strong>Talent</strong> -{" "}
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
              <MembershipEnquiry quote={quote} />
            </Reveal>
          </div>
        </div>
      </Section>
    </>
  );
}
