/**
 * Replaces placeholders in the legal document HTML templates with the actual data from the database.
 * This is the central source of truth for all variable mapping in legal documents (NDAs, MoUs, etc).
 *
 * @param html The raw HTML string of the legal document containing placeholders like {{COMPANY_NAME}}
 * @param entity The database record of the Ecosystem Partner or Company signing the document
 * @returns The HTML string with all placeholders replaced
 */
export function mapDocumentVariables(html: string, entity: any): string {
  if (!html) return "";
  
  // Format the date (e.g., "28 Aug 2026")
  const date = new Date().toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
  
  // Safely extract address components
  let address = "";
  if (entity?.contact_details?.location) {
    address = entity.contact_details.location;
    if (entity.contact_details.country) {
      address += `, ${entity.contact_details.country}`;
    }
  }

  // Safely extract email
  const email = entity?.email || entity?.contact_details?.email || '';

  // Safely extract name and representative details
  const entityName = entity?.name || '';
  const representativeName = entity?.contact_details?.contactPerson || entityName;
  const designation = entity?.contact_details?.designation || 'Representative';

  let mappedHtml = html;

  // Replace Organization Name variations
  mappedHtml = mappedHtml.replace(/(\[|\{\{)COMPANY_NAME(\]|\}\})/gi, entityName);
  mappedHtml = mappedHtml.replace(/(\[|\{\{)COMPANY NAME(\]|\}\})/gi, entityName);
  mappedHtml = mappedHtml.replace(/(\[|\{\{)PARTNER_NAME(\]|\}\})/gi, entityName);
  mappedHtml = mappedHtml.replace(/(\[|\{\{)PARTNER NAME(\]|\}\})/gi, entityName);
  mappedHtml = mappedHtml.replace(/(\[|\{\{)Ecosystem Partner Name(\]|\}\})/gi, entityName);
  
  // Replace standard variables
  mappedHtml = mappedHtml.replace(/(\[|\{\{)DATE(\]|\}\})/gi, date);
  mappedHtml = mappedHtml.replace(/(\[|\{\{)ADDRESS(\]|\}\})/gi, address);
  mappedHtml = mappedHtml.replace(/(\[|\{\{)CONTACT_EMAIL(\]|\}\})/gi, email);
  mappedHtml = mappedHtml.replace(/(\[|\{\{)REPRESENTATIVE NAME(\]|\}\})/gi, representativeName);
  mappedHtml = mappedHtml.replace(/(\[|\{\{)DESIGNATION(\]|\}\})/gi, designation);

  return mappedHtml;
}
