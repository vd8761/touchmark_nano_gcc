import type { Metadata } from "next";
import Link from "next/link";
import PageOpen from "@/components/PageOpen";
import Section from "@/components/Section";
import LegalDoc, { type Clause } from "@/components/LegalDoc";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Terms and conditions governing use of the Touchmark Nano GCC Hub website, institution membership, company engagement and fees - including the no-refund policy.",
};

/** Kept in sync by hand with the privacy policy. */
const LAST_UPDATED = "19 August 2026";

const CLAUSES: Clause[] = [
  {
    title: "Who these terms are for",
    body: (
      <>
        <p>
          Touchmark Nano GCC Hub is an initiative of <strong>{COMPANY.legalName}</strong>, a company
          incorporated in India with its registered office at{" "}
          {COMPANY.addresses[0].lines.join(", ")} (&ldquo;Touchmark&rdquo;, &ldquo;we&rdquo;,
          &ldquo;us&rdquo;). We operate this website and the Nano GCC ecosystem it describes. These
          terms govern your use of the website and, where applicable, your participation in the
          ecosystem as a company, an institution, a partner or an individual registering interest.
        </p>
        <p>
          This is a business-to-business service. It is intended for companies, educational
          institutions, industry bodies and other organisations, and for individuals acting on
          behalf of such an organisation. It is not intended for consumers, and it is not directed
          at children. By using the site or submitting any form on it, you confirm that you are
          authorised to act for the organisation you name.
        </p>
        <p>
          If you do not accept these terms, please do not use the site or submit an enquiry through
          it.
        </p>
      </>
    ),
  },
  {
    title: "What Touchmark does - and does not - do",
    body: (
      <>
        <p>
          Touchmark is a facilitator and mapping partner. We connect global technology companies
          with talent, institutional and innovation resources across Tamil Nadu, and help scope a
          Nano GCC around a stated capability goal.
        </p>
        <p>Nothing on this site should be read as an offer of, or a promise to deliver:</p>
        <ul>
          <li>recruitment, staffing or manpower supply services;</li>
          <li>guaranteed placement, employment or internships for any individual;</li>
          <li>direct access to a database of overseas company or institutional contacts;</li>
          <li>
            a guaranteed number of opportunities, partners, introductions or outcomes for a member
            institution;
          </li>
          <li>legal, tax, immigration, investment or regulatory advice of any kind.</li>
        </ul>
        <p>
          Careers and talent registration is a pipeline, not a job board. Registering interest
          creates no expectation of contact, consideration or placement.
        </p>
      </>
    ),
  },
  {
    title: "Enquiries, engagement and separate agreements",
    body: (
      <>
        <p>
          Submitting a form is an enquiry, not a contract. It does not create an engagement, a
          membership, a partnership, a joint venture or an agency relationship between us.
        </p>
        <p>
          Any actual engagement - a company building a Nano GCC, an institution taking up
          membership, a partner joining the ecosystem - is governed by a separate written agreement,
          proposal, membership schedule or statement of work signed by both sides. Where that
          agreement conflicts with these terms, the signed agreement prevails for that engagement.
        </p>
        <p>
          Commercial models, pricing, sourcing and delivery mechanics are shared in qualified
          conversations rather than published here. We may decline any enquiry, application or
          renewal at our discretion, and we are not obliged to give reasons.
        </p>
      </>
    ),
  },
  {
    title: "Fees and payment",
    body: (
      <>
        <p>
          Online payment is not yet available on this site. When it is introduced, the terms in this
          clause and the next will apply to every payment made to Touchmark, whether through the
          site or by bank transfer against an invoice.
        </p>
        <ul>
          <li>
            Fees - membership fees, programme fees, engagement fees and any other charges - are set
            out in the applicable proposal, membership schedule, invoice or checkout page at the
            time of purchase.
          </li>
          <li>
            Unless the paperwork says otherwise, fees are quoted exclusive of Goods and Services Tax
            and any other applicable taxes, duties, levies or withholding, which you pay in
            addition. Bank charges, card fees, payment-gateway charges and currency-conversion costs
            are yours.
          </li>
          <li>
            Fees are payable in advance. Access, membership or programme participation begins only
            once cleared funds are received.
          </li>
          <li>
            Membership and subscription terms run for the period stated at purchase and do not renew
            automatically unless that is expressly stated. Fees for a following period may differ
            from the current one.
          </li>
          <li>
            Overdue amounts may attract interest at 1.5% per month, or the maximum permitted by law
            if lower, and we may suspend access while an invoice is outstanding.
          </li>
        </ul>
        <p>
          Payments are processed by third-party payment providers. We do not receive or store your
          full card details - see the{" "}
          <Link href="/privacy">privacy policy</Link> for what we do receive.
        </p>
      </>
    ),
  },
  {
    title: "No refunds",
    body: (
      <>
        <p>
          <strong>
            All fees paid to Touchmark are non-refundable. Payments are final once made.
          </strong>{" "}
          This applies to membership fees, programme fees, engagement and scoping fees, event fees
          and any other amount paid, in whole or in part.
        </p>
        <p>Refunds are not available, including where:</p>
        <ul>
          <li>
            you decide not to proceed, change your requirement, restructure internally, or your
            budget or approvals change;
          </li>
          <li>
            a mapped opportunity, introduction, collaboration or Nano GCC does not result in the
            outcome you hoped for - the service is facilitation and access, not a guaranteed result;
          </li>
          <li>
            you use only part of a membership term, programme or engagement, or none of it;
          </li>
          <li>
            you are unable to participate, or your nominated people are unavailable, for reasons
            outside our control;
          </li>
          <li>
            an engagement is terminated early by you, or by us because of your breach of these terms
            or the signed agreement.
          </li>
        </ul>
        <p>
          Fees are also non-transferable to another organisation, and cannot be exchanged for credit
          against other services, unless we agree otherwise in writing.
        </p>
        <p>
          The only exceptions are a duplicate charge or a proven processing error on our side or the
          payment provider&rsquo;s, and any refund or cancellation right that applicable law gives
          you and that cannot lawfully be excluded. Report a suspected duplicate or incorrect charge
          within 15 days of the payment date, through the{" "}
          <Link href="/contact">contact page</Link>, with the transaction reference. Nothing in this
          clause limits the rights you cannot be asked to give up under Indian law.
        </p>
        <p>
          Because payments are final, please raise every question about scope, inclusions, duration
          and expected outcomes with us <em>before</em> paying.
        </p>
      </>
    ),
  },
  {
    title: "Your obligations",
    body: (
      <>
        <p>When you deal with us, you agree to:</p>
        <ul>
          <li>
            give accurate, current and complete information about yourself and your organisation,
            and keep it up to date;
          </li>
          <li>
            hold the authority to bind the organisation you name, and to share any third-party
            information you send us;
          </li>
          <li>
            use the site and the ecosystem only for lawful business purposes, and not to scrape,
            harvest, resell, sublicense or redistribute anything you receive through it;
          </li>
          <li>
            not misrepresent your relationship with Touchmark, or use our name, logo or membership
            status in a way that overstates it;
          </li>
          <li>
            not attempt to gain unauthorised access to the site, disrupt it, or interfere with its
            security.
          </li>
        </ul>
        <p>
          Any recognition, certificate or membership status we issue reflects genuine engagement in
          the ecosystem. It is not an accreditation, ranking, endorsement or certification of your
          organisation, and it must not be presented as one.
        </p>
      </>
    ),
  },
  {
    title: "Confidentiality and the ecosystem",
    body: (
      <>
        <p>
          Operational detail about how the ecosystem works - sourcing, mapping and delivery
          mechanics, partner specifics, pricing, and any material shared in a qualified conversation
          - is confidential. You may use it only to evaluate or carry out an engagement with us, and
          you must not disclose it to third parties without our written consent.
        </p>
        <p>
          Information you send us about your own requirement is treated the same way and shared
          internally, and with prospective ecosystem participants, only as far as needed to act on
          your enquiry.
        </p>
      </>
    ),
  },
  {
    title: "Intellectual property",
    body: (
      <>
        <p>
          The site and its content - text, structure, design, brand names, logos, brochures and
          other materials - belong to Touchmark or its licensors and are protected by intellectual
          property law. You may view, and print or download a reasonable number of copies of,
          material for your own internal business evaluation. Everything else - republishing,
          commercial reuse, modification, or use in a competing offering - needs our written
          consent.
        </p>
        <p>
          Third-party names, logos and marks shown on the site remain the property of their owners.
          Illustrations are used under the licences credited alongside them.
        </p>
        <p>
          Intellectual property created inside a Nano GCC engagement is dealt with in the signed
          agreement for that engagement, not here.
        </p>
      </>
    ),
  },
  {
    title: "Third-party links and partners",
    body: (
      <p>
        The site may link to, or name, third-party organisations, institutions and partners. We do
        not control them, are not responsible for their content, services or conduct, and naming
        them is not an endorsement. Any dealing you have directly with a third party is between you
        and them.
      </p>
    ),
  },
  {
    title: "Disclaimers",
    body: (
      <>
        <p>
          The site and its content are provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;,
          for general information. We take care over what we publish, but we do not warrant that it
          is complete, current or error-free, or that the site will be uninterrupted or secure. We
          may change, suspend or withdraw any part of the site, or any programme described on it, at
          any time.
        </p>
        <p>
          Illustrative examples, anonymised stories and indicative figures - including team-size
          ranges and timelines - describe what the model is designed to do. They are not forecasts,
          representations or guarantees of any particular result for you.
        </p>
      </>
    ),
  },
  {
    title: "Limitation of liability",
    body: (
      <>
        <p>
          To the fullest extent permitted by law, we are not liable for indirect, incidental,
          special or consequential loss, or for loss of profit, revenue, business, goodwill,
          anticipated savings, data, or opportunity, however it arises.
        </p>
        <p>
          Our total aggregate liability arising out of or in connection with these terms, the site,
          or any engagement is limited to the total fees you actually paid us in the twelve months
          immediately before the event giving rise to the claim - or, where you have paid us
          nothing, to INR 10,000.
        </p>
        <p>
          Nothing in these terms excludes or limits liability for fraud, fraudulent
          misrepresentation, wilful misconduct, or any liability that cannot lawfully be excluded.
        </p>
      </>
    ),
  },
  {
    title: "Indemnity",
    body: (
      <p>
        You agree to indemnify Touchmark and its officers, employees and agents against claims,
        losses, liabilities and reasonable costs arising from your breach of these terms, your
        misuse of the site or the ecosystem, your infringement of a third party&rsquo;s rights, or
        the inaccuracy of information you gave us.
      </p>
    ),
  },
  {
    title: "Suspension and termination",
    body: (
      <p>
        We may suspend or terminate your access to the site, a membership, or participation in the
        ecosystem if you breach these terms or a signed agreement, if payment is not received, or if
        continued participation would expose us or other participants to legal or reputational risk.
        Termination does not entitle you to any refund - see clause 05 - and does not affect rights
        that accrued before it.
      </p>
    ),
  },
  {
    title: "Force majeure",
    body: (
      <p>
        We are not in breach of these terms, and not liable for delay or non-performance, where it is
        caused by events beyond our reasonable control - including acts of God, natural disaster,
        epidemic, war, civil unrest, strike, government action, and failure of power,
        telecommunications or internet infrastructure.
      </p>
    ),
  },
  {
    title: "Governing law and jurisdiction",
    body: (
      <p>
        These terms are governed by the laws of India. The courts at Chennai, Tamil Nadu have
        exclusive jurisdiction over any dispute arising out of or in connection with them, and you
        and we both submit to that jurisdiction. Before starting proceedings, each side agrees to
        raise the issue in writing and to try in good faith to resolve it within 30 days.
      </p>
    ),
  },
  {
    title: "Changes to these terms",
    body: (
      <p>
        We may update these terms as the ecosystem and its services develop - not least when online
        payment is introduced. The version published on this page is the one in force, and the date
        it last changed is shown at the top. Material changes take effect when published; continuing
        to use the site afterwards means you accept the updated terms. Terms already agreed in a
        signed engagement are not changed by a website update.
      </p>
    ),
  },
  {
    title: "Contact",
    body: (
      <>
        <p>
          Questions about these terms, an invoice, or a suspected incorrect charge can be sent
          through the <Link href="/contact">contact page</Link> or directly to the addresses below.
          Please include your organisation name and, for a payment query, the transaction reference
          and date.
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
          The company also operates from a second Chennai office, and from Singapore and the United
          Kingdom; correspondence about these terms should go to the registered office above.
        </p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <>
      <PageOpen
        index="11"
        label="Terms & Conditions"
        title={<>The terms we <em>work under</em>.</>}
        lede="These terms govern use of this site and participation in the Nano GCC ecosystem as a company, institution, partner or individual. They are written for organisations, not consumers."
        note={{
          title: "Read clause 05 first",
          body: "All fees paid to Touchmark are non-refundable. Settle scope and expectations before you pay.",
        }}
      />

      <Section index="12" label="Terms of use and engagement" note={`Last updated ${LAST_UPDATED}`}>
        <LegalDoc clauses={CLAUSES} />
        <p className="body" style={{ marginTop: 30, fontSize: "0.9rem" }}>
          See also the <Link href="/privacy" style={{ borderBottom: "1px solid currentColor" }}>privacy policy</Link>, which
          explains what we do with the information you send us.
        </p>
      </Section>
    </>
  );
}
