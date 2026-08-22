import type { Metadata } from "next";
import Link from "next/link";
import PageOpen from "@/components/PageOpen";
import Section from "@/components/Section";
import LegalDoc, { type Clause } from "@/components/LegalDoc";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Touchmark Nano GCC Hub collects, uses, shares and protects the information companies, institutions and individuals submit through this website.",
};

/** Kept in sync by hand with the terms page. */
const LAST_UPDATED = "19 August 2026";

const CLAUSES: Clause[] = [
  {
    title: "Scope of this policy",
    body: (
      <>
        <p>
          Touchmark Nano GCC Hub is an initiative of <strong>{COMPANY.legalName}</strong>,
          registered at {COMPANY.addresses[0].lines.join(", ")} (&ldquo;Touchmark&rdquo;,
          &ldquo;we&rdquo;, &ldquo;us&rdquo;), which is the data fiduciary for the information
          described here. This policy explains how we handle information collected through this
          website and through the enquiry, membership and registration forms on it.
        </p>
        <p>
          Most of what we hold is business contact information about people acting for a company or
          an institution, rather than personal information about private individuals. It is treated
          with the same care either way.
        </p>
        <p>
          It does not cover the sites of partner institutions, industry bodies or third parties we
          link to. Those have their own policies.
        </p>
      </>
    ),
  },
  {
    title: "Information we collect",
    body: (
      <>
        <p>
          <strong>What you give us.</strong> Through the forms on this site, and any follow-up
          conversation, we collect your name, work email address, telephone number where you provide
          it, your organisation and role, the audience you fall into - company, institution, partner
          or individual - and whatever you write in the message field, including your capability
          goal, institutional strengths or area of expertise.
        </p>
        <p>
          <strong>What we collect automatically.</strong> Standard technical information sent by
          your browser when you load a page: IP address, browser and device type, referring page,
          the pages you view and when. This is used to keep the site available and secure and to
          understand at a coarse level which pages are read.
        </p>
        <p>
          <strong>Payments.</strong> Online payments are taken on our payment page at originbi.com
          and processed there by Razorpay as payment gateway. We receive confirmation details -
          amount, currency, date, our own reference ID, the gateway transaction reference, the
          payment method and status, and the billing name and organisation - but not your full card
          number, CVV, UPI PIN or banking credentials, which go directly to the gateway and never
          reach this site.
        </p>
        <p>
          <strong>Membership records.</strong> Where a payment succeeds we create a membership
          record holding your name, institution, email address, membership number and the payment
          details above. You can retrieve your own record at any time from the contact page, using
          your email address or your reference ID.
        </p>
        <p>
          <strong>Email delivery.</strong> We send transactional email through Resend, and record
          whether each message was delivered, bounced or was marked as spam. This is used to tell
          whether a receipt reached you, not to build a profile.
        </p>
        <p>
          Please do not send us confidential technical material, personal data about third parties,
          or special-category information through the forms. If you send us details of colleagues or
          students, you confirm you are entitled to share them.
        </p>
      </>
    ),
  },
  {
    title: "Why we use it",
    body: (
      <>
        <p>We use the information to:</p>
        <ul>
          <li>respond to your enquiry and qualify what you are trying to build or offer;</li>
          <li>
            map institutional strengths, company requirements and individual expertise against live
            opportunities in the Nano GCC ecosystem;
          </li>
          <li>administer membership, engagements, events and programmes, including invoicing;</li>
          <li>process payments, and keep the accounting and tax records the law requires;</li>
          <li>
            send operational messages about an enquiry, engagement or membership you have with us;
          </li>
          <li>
            send occasional updates about the ecosystem where you have asked for them or where you
            are an existing business contact - you can opt out at any time;
          </li>
          <li>maintain the security, integrity and performance of the site;</li>
          <li>comply with legal obligations and enforce our terms.</li>
        </ul>
        <p>
          The legal bases we rely on are the steps needed to enter into or perform a contract with
          you or your organisation, our legitimate interest in operating and improving the
          ecosystem, compliance with legal obligations, and your consent where consent is required
          - for example for marketing messages you have asked for.
        </p>
        <p>
          <strong>We do not sell your information</strong>, and we do not rent, trade or licence it
          to anyone for their own marketing.
        </p>
      </>
    ),
  },
  {
    title: "Who we share it with",
    body: (
      <>
        <p>We share information only as far as it is needed, with:</p>
        <ul>
          <li>
            <strong>Ecosystem participants</strong> - companies, institutions or partners - where
            sharing your details is the point of your enquiry, and to the extent needed to explore a
            specific opportunity. Where the recipient is a company or institution rather than an
            internal service provider, we seek your agreement before making an introduction.
          </li>
          <li>
            <strong>Service providers</strong> who work for us under contract: hosting, email,
            analytics, CRM and payment processing - currently including Neon (database hosting),
            Resend (email delivery) and Razorpay (payment gateway). They may use the
            information only to provide their service to us.
          </li>
          <li>
            <strong>Professional advisers</strong> - auditors, accountants and lawyers - where
            necessary.
          </li>
          <li>
            <strong>Authorities</strong>, where we are required to disclose by law, court order or a
            valid regulatory request, or to establish, exercise or defend legal claims.
          </li>
          <li>
            <strong>A successor</strong>, if the business or part of it is reorganised, merged or
            transferred, subject to this policy continuing to apply.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "International transfers",
    body: (
      <p>
        The Nano GCC ecosystem spans companies outside India - including Singapore, Japan,
        Mauritius, the United States, Australia, Canada, Malaysia, Germany and the UAE - and some of
        our service providers host data outside India. Your information may therefore be
        transferred to, stored in or accessed from other countries, whose data-protection laws may
        differ from those where you are. Where we make such a transfer we take reasonable steps -
        including contractual protections with the recipient - to keep the information protected in
        line with this policy.
      </p>
    ),
  },
  {
    title: "Cookies and analytics",
    body: (
      <>
        <p>
          The site is a static export and does not set advertising cookies or run cross-site
          tracking. Cookies or similar storage may be used for essential functions - for example
          remembering a form submission - and, where analytics is enabled, to produce aggregate
          statistics about how the site is used.
        </p>
        <p>
          Your browser lets you block or delete cookies. Essential functions may not work correctly
          if you block them. We do not respond to browser &ldquo;Do Not Track&rdquo; signals, as
          there is no agreed standard for them.
        </p>
      </>
    ),
  },
  {
    title: "How long we keep it",
    body: (
      <>
        <p>
          We keep information only as long as it serves the purpose it was collected for, and then
          for as long as the law requires.
        </p>
        <ul>
          <li>
            Enquiries that do not progress: normally up to 24 months, so we can pick the
            conversation back up if the opportunity returns.
          </li>
          <li>
            Members, partners and engaged companies: for the term of the relationship and for the
            period afterwards required for legal, tax and audit purposes.
          </li>
          <li>
            Payment and invoice records: for the retention period required by Indian tax and company
            law, currently a minimum of eight years.
          </li>
          <li>Talent registrations: up to 24 months, unless you ask us to remove them sooner.</li>
        </ul>
      </>
    ),
  },
  {
    title: "Security",
    body: (
      <p>
        We use reasonable technical and organisational measures to protect the information we hold -
        encrypted transport, access limited to people who need it, and vetted service providers. No
        website or transmission is completely secure, so we cannot guarantee absolute security. If a
        breach affects your information and is likely to cause you harm, we will notify you and the
        relevant authority as the law requires.
      </p>
    ),
  },
  {
    title: "Your choices and rights",
    body: (
      <>
        <p>Subject to applicable law, you can ask us to:</p>
        <ul>
          <li>confirm what information we hold about you, and give you a copy;</li>
          <li>correct information that is inaccurate, incomplete or out of date;</li>
          <li>
            erase information we no longer need, or withdraw consent you gave - which does not
            affect processing already carried out;
          </li>
          <li>stop sending you marketing or ecosystem updates;</li>
          <li>
            restrict or object to certain processing, or nominate someone to exercise these rights
            if you are unable to.
          </li>
        </ul>
        <p>
          Make a request through the <Link href="/contact">contact page</Link>. We may need to
          verify your identity, and we will respond within the period the applicable law allows. We
          may keep information we are legally required to retain - invoicing and tax records, for
          example - even after an erasure request. If you are not satisfied with our response, you
          may complain to the data-protection authority in your jurisdiction.
        </p>
      </>
    ),
  },
  {
    title: "Children",
    body: (
      <p>
        This site is for businesses and institutions and is not directed at children. We do not
        knowingly collect information from anyone under 18. Where an institution shares student
        information with us in connection with internships or programmes, the institution is
        responsible for holding the necessary consents. If you believe a child&rsquo;s information
        has reached us, contact us and we will delete it.
      </p>
    ),
  },
  {
    title: "Changes to this policy",
    body: (
      <p>
        We will update this policy as the site and the ecosystem develop. The version published
        here is the one in force, with the date it last changed shown at the top of this section.
        Material changes take effect when published.
      </p>
    ),
  },
  {
    title: "Contact",
    body: (
      <>
        <p>
          For any question about this policy, or to exercise the rights described above, reach us
          through the <Link href="/contact">contact page</Link> or at the details below. Please say
          which right you are exercising and give the name and organisation you used when you
          contacted us, so we can find the right record.
        </p>
        <p>
          <strong>{COMPANY.legalName}</strong>
          <br />
          {COMPANY.addresses[0].lines.map((l) => (
            <span key={l}>
              {l}
              <br />
            </span>
          ))}
          Email: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
          <br />
          Telephone: {COMPANY.phones[0]}
        </p>
        <p>
          The company also operates offices at Plot No. S-16, 15th Main Road, Thiru Vi Ka Industrial
          Estate, Guindy, Chennai 600032; Blk 144, Pasir Ris Street, #05-89, Singapore 510144; and 1
          Roseneath Avenue, Leicester, England, LE4 7GS. Privacy requests should be sent to the
          registered office or the email address above.
        </p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageOpen
        index="11"
        label="Privacy Policy"
        title={<>What we do with what you <em>tell us</em>.</>}
        lede="This site collects business contact details and the substance of your enquiry so we can qualify it and map it against live opportunities. This policy sets out exactly what is collected, who sees it and how long it is kept."
        note={{
          title: "The short version",
          body: "We use what you send to act on your enquiry. We do not sell it, and you can ask us to correct or delete it.",
        }}
      />

      <Section index="12" label="Privacy and data protection" note={`Last updated ${LAST_UPDATED}`}>
        <LegalDoc clauses={CLAUSES} />
        <p className="body" style={{ marginTop: 30, fontSize: "0.9rem" }}>
          See also the{" "}
          <Link href="/terms" style={{ borderBottom: "1px solid currentColor" }}>
            terms &amp; conditions
          </Link>
          , including the fees and no-refund clauses.
        </p>
      </Section>
    </>
  );
}
