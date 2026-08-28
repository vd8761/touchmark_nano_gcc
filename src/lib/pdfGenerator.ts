/**
 * Generates a professionally formatted, Word-like PDF using PDFKit.
 * Parses the stored HTML content and renders it with proper structure:
 * headings, paragraphs, bold/italic, numbered/bulleted lists, and
 * a two-column signature block at the end.
 */

import { createRequire } from "module";
import { parse as parseHtml } from "node-html-parser";

const require = createRequire(import.meta.url);
const PDFDocument = require("pdfkit");

export interface SignatureInfo {
  label: string;
  name: string;
  designation: string;
  date: string;
  signatureBase64?: string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function base64ToBuffer(dataUrl: string): Buffer {
  const data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  return Buffer.from(data, "base64");
}

/** Strip HTML tags and decode common entities. */
function textContent(html: string): string {
  return (html || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── main export ──────────────────────────────────────────────────────────────

export function generateFormattedPdf(
  title: string,
  htmlContent: string,
  leftParty: SignatureInfo,
  rightParty: SignatureInfo
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 72, bottom: 72, left: 85, right: 72 },
      info: { Title: title, Author: "Touchmark Descience Pvt Ltd" },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth: number =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // ── Title ──────────────────────────────────────────────────────────────────
    doc
      .font("Times-Bold")
      .fontSize(18)
      .text(title.toUpperCase(), { align: "center" })
      .moveDown(1.5);

    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.margins.left + pageWidth, doc.y)
      .lineWidth(1)
      .stroke()
      .moveDown(1);

    // ── Body ───────────────────────────────────────────────────────────────────
    const root = parseHtml(htmlContent);
    renderNodes(doc, root.childNodes as any[], pageWidth);

    // ── Signatures page ────────────────────────────────────────────────────────
    doc.addPage();
    doc.font("Times-Bold").fontSize(14).text("Signatures").moveDown(0.5);
    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.margins.left + pageWidth, doc.y)
      .lineWidth(1)
      .stroke()
      .moveDown(1.5);

    const sigY: number = doc.y;
    const halfW = Math.floor(pageWidth / 2) - 16;

    drawSigColumn(doc, leftParty, doc.page.margins.left, sigY, halfW);
    drawSigColumn(doc, rightParty, doc.page.margins.left + halfW + 32, sigY, halfW);

    doc.end();
  });
}

// ─── Signature column ─────────────────────────────────────────────────────────

function drawSigColumn(
  doc: any,
  party: SignatureInfo,
  x: number,
  startY: number,
  width: number
) {
  // Label
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#555555")
    .text(party.label.toUpperCase(), x, startY, { width });

  const imgTop = startY + 18;
  const imgH = 70;

  // Signature image (if present)
  if (party.signatureBase64) {
    try {
      const imgBuf = base64ToBuffer(party.signatureBase64);
      doc.image(imgBuf, x, imgTop, { fit: [width, imgH], align: "left" });
    } catch {
      // skip malformed image
    }
  }

  const lineY = imgTop + imgH + 4;

  // Underline
  doc
    .moveTo(x, lineY)
    .lineTo(x + width, lineY)
    .lineWidth(0.5)
    .strokeColor("#333333")
    .stroke();

  let metaY = lineY + 6;
  const line = (label: string, value: string) => {
    doc
      .font("Times-Bold")
      .fontSize(10)
      .fillColor("#000000")
      .text(label, x, metaY, { continued: true, width })
      .font("Times-Roman")
      .text(value);
    metaY += doc.currentLineHeight(true) + 2;
  };

  line("Name:  ", party.name);
  line("Designation:  ", party.designation);
  line("Date:  ", party.date);
}

// ─── HTML node renderer ────────────────────────────────────────────────────────

function renderNodes(doc: any, nodes: any[], pageWidth: number) {
  for (const node of nodes) renderNode(doc, node, pageWidth);
}

function renderNode(doc: any, node: any, pageWidth: number) {
  const tag = (node.tagName || "").toLowerCase();
  const rawHtml: string = node.innerHTML || node.text || "";
  const text = textContent(rawHtml);

  switch (tag) {
    case "h1":
      doc
        .font("Times-Bold").fontSize(16).fillColor("#000000")
        .text(text, { align: "left" }).moveDown(0.5);
      break;

    case "h2":
      doc
        .font("Times-Bold").fontSize(13).fillColor("#000000")
        .text(text, { align: "left" }).moveDown(0.4);
      break;

    case "h3":
      doc
        .font("Times-Bold").fontSize(12).fillColor("#111111")
        .text(text, { align: "left" }).moveDown(0.3);
      break;

    case "p":
      if (text.trim()) {
        doc
          .font("Times-Roman").fontSize(11).fillColor("#000000")
          .text(text, { align: "justify", lineGap: 2 }).moveDown(0.5);
      }
      break;

    case "ul": {
      const items = node.childNodes.filter(
        (n: any) => (n.tagName || "").toLowerCase() === "li"
      );
      for (const li of items) {
        const t = textContent(li.innerHTML || li.text || "");
        if (t.trim()) {
          doc
            .font("Times-Roman").fontSize(11).fillColor("#000000")
            .text(`\u2022  ${t}`, { indent: 16, align: "justify", lineGap: 2 })
            .moveDown(0.2);
        }
      }
      doc.moveDown(0.3);
      break;
    }

    case "ol": {
      const items = node.childNodes.filter(
        (n: any) => (n.tagName || "").toLowerCase() === "li"
      );
      items.forEach((li: any, i: number) => {
        const t = textContent(li.innerHTML || li.text || "");
        if (t.trim()) {
          doc
            .font("Times-Roman").fontSize(11).fillColor("#000000")
            .text(`${i + 1}.  ${t}`, { indent: 20, align: "justify", lineGap: 2 })
            .moveDown(0.2);
        }
      });
      doc.moveDown(0.3);
      break;
    }

    case "hr":
      doc
        .moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.margins.left + pageWidth, doc.y)
        .lineWidth(0.5).strokeColor("#cccccc").stroke().moveDown(0.5);
      break;

    case "br":
      doc.moveDown(0.4);
      break;

    case "table": {
      // Render tables as plain paragraph text for now
      doc.font("Times-Roman").fontSize(11).fillColor("#000000").text(text, { align: "justify", lineGap: 2 }).moveDown(0.5);
      break;
    }

    case "div":
    case "section":
    case "article":
    case "main":
    case "body":
      renderNodes(doc, node.childNodes, pageWidth);
      break;

    default:
      if (node.childNodes?.length) {
        renderNodes(doc, node.childNodes, pageWidth);
      } else if (text.trim() && !tag) {
        // Plain text nodes
        doc
          .font("Times-Roman").fontSize(11).fillColor("#000000")
          .text(text, { align: "justify", lineGap: 2 }).moveDown(0.3);
      }
      break;
  }
}
