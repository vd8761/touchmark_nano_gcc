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

function base64ToBuffer(dataUrl: string): Buffer {
  const data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  return Buffer.from(data, "base64");
}

function decodeEntities(html: string): string {
  return (html || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

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

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Body
    const root = parseHtml(htmlContent);
    renderNodes(doc, root.childNodes as any[], pageWidth);

    // Signatures
    if (doc.y > doc.page.height - 200) { doc.addPage(); } else { doc.moveDown(2); }

    const sigY = doc.y;
    const halfW = Math.floor(pageWidth / 2) - 16;
    drawSigColumn(doc, leftParty, doc.page.margins.left, sigY, halfW);
    drawSigColumn(doc, rightParty, doc.page.margins.left + halfW + 32, sigY, halfW);

    doc.end();
  });
}

function drawSigColumn(doc: any, party: SignatureInfo, x: number, startY: number, width: number) {
  doc.font("Times-Roman").fontSize(8).fillColor("#555555").text(party.label.toUpperCase(), x, startY, { width });
  const imgTop = startY + 18;
  const imgH = 70;

  if (party.signatureBase64) {
    try {
      doc.image(base64ToBuffer(party.signatureBase64), x, imgTop, { fit: [width, imgH], align: "left" });
    } catch {}
  }

  const lineY = imgTop + imgH + 4;
  doc.moveTo(x, lineY).lineTo(x + width, lineY).lineWidth(0.5).strokeColor("#333333").stroke();

  let metaY = lineY + 6;
  const line = (label: string, value: string) => {
    doc.font("Times-Bold").fontSize(10).fillColor("#000000").text(label, x, metaY, { continued: true, width }).font("Times-Roman").text(value);
    metaY += doc.currentLineHeight(true) + 2;
  };

  line("Name:  ", party.name);
  line("Designation:  ", party.designation);
  line("Date:  ", party.date);
}

// Rich Text Renderer for PDFKit
function renderRichText(doc: any, nodes: any[], options: any = {}) {
  const flattened: any[] = [];

  function traverse(node: any, currentStyles: any) {
    if (node.nodeType === 3) { // Text node
      const text = decodeEntities(node.rawText).replace(/\\s+/g, " ");
      if (text) {
        flattened.push({ text, styles: { ...currentStyles } });
      }
    } else if (node.nodeType === 1) { // Element node
      const tag = (node.tagName || "").toLowerCase();
      const styles = { ...currentStyles };
      if (tag === "strong" || tag === "b") styles.bold = true;
      if (tag === "em" || tag === "i") styles.italic = true;
      if (tag === "u") styles.underline = true;
      
      if (tag === "br") {
        flattened.push({ text: "\n", styles: { ...styles } });
      } else {
        for (const child of (node.childNodes || [])) {
          traverse(child, styles);
        }
      }
    }
  }

  for (const node of nodes) traverse(node, {});

  // Clean up whitespace between chunks
  let combined = "";
  for (let i = 0; i < flattened.length; i++) {
    const chunk = flattened[i];
    
    // Choose Font
    let font = "Times-Roman";
    if (chunk.styles.bold && chunk.styles.italic) font = "Times-BoldItalic";
    else if (chunk.styles.bold) font = "Times-Bold";
    else if (chunk.styles.italic) font = "Times-Italic";

    const isLast = i === flattened.length - 1;
    doc.font(font)
       .fontSize(options.fontSize || 12)
       .fillColor("#000000")
       .text(chunk.text, { 
         ...options, 
         continued: !isLast 
       });
  }
}


function getAlign(node: any, defaultAlign: string = "justify"): string {
  if (!node || !node.getAttribute) return defaultAlign;
  const style = node.getAttribute("style") || "";
  const cls = node.getAttribute("class") || "";
  const s = style.toLowerCase().replace(/\s+/g, "") + " " + cls.toLowerCase();
  if (s.includes("text-align:center") || s.includes("text-center")) return "center";
  if (s.includes("text-align:right") || s.includes("text-end") || s.includes("text-right")) return "right";
  if (s.includes("text-align:left") || s.includes("text-start") || s.includes("text-left")) return "left";
  if (s.includes("text-align:justify") || s.includes("text-justify")) return "justify";
  return defaultAlign;
}

function renderTable(doc: any, tableNode: any, pageWidth: number) {
  const rows = tableNode.querySelectorAll('tr');
  if (!rows || rows.length === 0) return;

  const colCount = rows[0].querySelectorAll('th, td').length || 1;
  const colWidth = pageWidth / colCount;
  
  let currentY = doc.y;

  for (const row of rows) {
    const cells = row.querySelectorAll('th, td');
    let maxRowHeight = 0;
    
    // Measure row height
    const startY = doc.y;
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const text = decodeEntities(cell.rawText).trim().replace(/\s+/g, " ");
      const height = doc.heightOfString(text, { width: colWidth - 10, align: getAlign(node, "left") as any });
      if (height > maxRowHeight) maxRowHeight = height;
    }

    // Check page break
    if (startY + maxRowHeight + 10 > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      currentY = doc.y;
    }

    // Draw cells
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const text = decodeEntities(cell.rawText).trim().replace(/\s+/g, " ");
      const x = doc.page.margins.left + (i * colWidth);
      
      // Draw border
      doc.rect(x, doc.y, colWidth, maxRowHeight + 10).stroke();
      
      // Draw text
      doc.font(cell.tagName.toLowerCase() === 'th' ? "Times-Bold" : "Times-Roman")
         .fontSize(11)
         .text(text, x + 5, doc.y + 5, { width: colWidth - 10, align: getAlign(node, "left") as any });
    }
    
    doc.y = startY + maxRowHeight + 10;
  }
  doc.moveDown(1);
}
function renderNodes(doc: any, nodes: any[], pageWidth: number) {
  for (const node of nodes) renderNode(doc, node, pageWidth);
}

function renderNode(doc: any, node: any, pageWidth: number) {
  if (node.nodeType === 3) {
    const text = decodeEntities(node.rawText).replace(/\s+/g, " ");
    if (text.trim()) renderRichText(doc, [node], { align: getAlign(node, "justify") as any, lineGap: 3 });
    return;
  }

  const tag = (node.tagName || "").toLowerCase();
  
  switch (tag) {
    case "h1":
      if (doc.y > doc.page.margins.top + 20) doc.moveDown(1.5);
      doc.font("Times-Bold").fontSize(20).fillColor("#000000");
      renderRichText(doc, node.childNodes, { align: getAlign(node, "left") as any, fontSize: 20 });
      doc.moveDown(1);
      break;

    case "h2":
      if (doc.y > doc.page.margins.top + 20) doc.moveDown(1);
      doc.font("Times-Bold").fontSize(16).fillColor("#000000");
      renderRichText(doc, node.childNodes, { align: getAlign(node, "left") as any, fontSize: 16 });
      doc.moveDown(0.4);
      break;

    case "h3":
      if (doc.y > doc.page.margins.top + 20) doc.moveDown(0.5);
      doc.font("Times-Bold").fontSize(14).fillColor("#111111");
      renderRichText(doc, node.childNodes, { align: getAlign(node, "left") as any, fontSize: 14 });
      doc.moveDown(0.3);
      break;

    case "p":
      renderRichText(doc, node.childNodes, { align: getAlign(node, "justify") as any, lineGap: 3, fontSize: 11 });
      doc.moveDown(1);
      break;

    case "ul": {
      const items = node.childNodes.filter((n: any) => (n.tagName || "").toLowerCase() === "li");
      for (const li of items) {
        doc.font("Times-Roman").fontSize(11).fillColor("#000000").text("\u2022  ", { indent: 16, continued: true, lineGap: 3 });
        renderRichText(doc, li.childNodes, { align: getAlign(node, "justify") as any, lineGap: 3, fontSize: 11 });
        doc.moveDown(0.5);
      }
      doc.moveDown(0.5);
      break;
    }

    case "ol": {
      const items = node.childNodes.filter((n: any) => (n.tagName || "").toLowerCase() === "li");
      items.forEach((li: any, i: number) => {
        doc.font("Times-Roman").fontSize(11).fillColor("#000000").text(i + 1 + ".  ", { indent: 20, continued: true, lineGap: 3 });
        renderRichText(doc, li.childNodes, { align: getAlign(node, "justify") as any, lineGap: 3, fontSize: 11 });
        doc.moveDown(0.2);
      });
      doc.moveDown(0.3);
      break;
    }

    case "hr":
      doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.margins.left + pageWidth, doc.y).lineWidth(0.5).strokeColor("#cccccc").stroke().moveDown(1);
      break;

    case "br":
      doc.moveDown(0.4);
      break;
      
    case "table":
      renderTable(doc, node, pageWidth);
      break;

    case "div":
    case "section":
    case "article":
    case "main":
    case "body":
    case "span":
      renderNodes(doc, node.childNodes, pageWidth);
      break;
  }
}
