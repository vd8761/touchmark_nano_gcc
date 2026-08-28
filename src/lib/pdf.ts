import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

import { CORPORATE_MOU_TEMPLATE, NDA_TEMPLATE, COMMISSION_TEMPLATE } from "./pdf-templates";

export type DocumentType = "NDA" | "COMMISSION" | "MOU";

interface DocumentData {
  companyName: string;
  date: string;
  country?: string;
  address?: string;
  representativeName?: string;
  designation?: string;
  commissionType?: string;
  commissionValue?: string;
}

function getTemplate(type: DocumentType): string {
  if (type === "NDA") return NDA_TEMPLATE;
  if (type === "COMMISSION") return COMMISSION_TEMPLATE;
  return CORPORATE_MOU_TEMPLATE;
}

function replaceVariables(text: string, data: DocumentData): string {
  return text
    .replace(/{{COMPANY_NAME}}/g, data.companyName || "[Company Name]")
    .replace(/{{DATE}}/g, data.date || "[Date]")
    .replace(/{{COUNTRY}}/g, data.country || "[Country]")
    .replace(/{{ADDRESS}}/g, data.address || "[Address]")
    .replace(/{{REPRESENTATIVE_NAME}}/g, data.representativeName || "[Representative Name]")
    .replace(/{{DESIGNATION}}/g, data.designation || "[Designation]")
    .replace(/{{COMMISSION_TYPE}}/g, data.commissionType || "Percentage")
    .replace(/{{COMMISSION_VALUE}}/g, data.commissionValue || "0%");
}

/**
 * Generates an onboarding document dynamically using pdf-lib text wrapping.
 */
export async function generateDocument(
  type: DocumentType,
  data: DocumentData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  
  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const margin = 50;
  const fontSize = 12;
  const lineHeight = 16;
  let cursorY = height - margin;

  const rawText = getTemplate(type);
  const finalContent = replaceVariables(rawText, data);
  const paragraphs = finalContent.split('\n');

  for (const para of paragraphs) {
    if (para.trim() === '') {
      cursorY -= lineHeight;
      continue;
    }

    const words = para.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const textWidth = font.widthOfTextAtSize(testLine, fontSize);
      
      if (textWidth > width - margin * 2) {
        // Draw current line and move down
        if (cursorY < margin) {
          page = pdfDoc.addPage();
          cursorY = height - margin;
        }
        page.drawText(currentLine, { x: margin, y: cursorY, size: fontSize, font: font, color: rgb(0, 0, 0) });
        currentLine = word;
        cursorY -= lineHeight;
      } else {
        currentLine = testLine;
      }
    }

    // Draw the last line of the paragraph
    if (currentLine) {
      if (cursorY < margin) {
        page = pdfDoc.addPage();
        cursorY = height - margin;
      }
      page.drawText(currentLine, { x: margin, y: cursorY, size: fontSize, font: font, color: rgb(0, 0, 0) });
      cursorY -= lineHeight * 1.5; // paragraph spacing
    }
  }

  return await pdfDoc.save();
}

/**
 * Stamps a base64 signature image onto an existing PDF document.
 */
export async function stampSignature(
  pdfBytes: Uint8Array,
  signatureBase64: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  
  // Convert base64 to Uint8Array
  const base64Data = signatureBase64.replace(/^data:image\/\w+;base64,/, "");
  const signatureImageBytes = Buffer.from(base64Data, "base64");
  
  // Embed the image (assuming PNG for the signature canvas)
  const pngImage = await pdfDoc.embedPng(signatureImageBytes);
  const pngDims = pngImage.scale(0.5);

  const pages = pdfDoc.getPages();
  const firstPage = pages[0]; // Stamp on first page or target page

  firstPage.drawImage(pngImage, {
    x: 120,
    y: firstPage.getSize().height - 350,
    width: pngDims.width,
    height: pngDims.height,
  });

  return await pdfDoc.save();
}
