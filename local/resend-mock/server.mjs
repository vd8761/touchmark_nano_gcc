/**
 * Resend API mock.
 *
 * Implements just enough of https://api.resend.com for this app: `POST /emails`.
 * The message is relayed into Mailpit over SMTP so you can actually read it,
 * and then Svix-signed delivery webhooks are fired back at the app so the
 * admin Emails page fills in exactly as it would in production.
 *
 * Point the Resend SDK here with `RESEND_BASE_URL` - it needs no code change,
 * the SDK reads that variable itself.
 *
 * No dependencies: Node built-ins only, so the container needs no install step.
 */

import { createServer } from "node:http";
import { connect } from "node:net";
import { createHmac, randomUUID } from "node:crypto";

const PORT = Number(process.env.PORT ?? 4001);
const SMTP_HOST = process.env.SMTP_HOST ?? "mailpit";
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 1025);
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? "";
const APP_URL = process.env.APP_URL ?? "http://host.docker.internal:3000";

const CRLF = "\r\n";
const log = (...args) => console.log("[resend-mock]", ...args);

// ---------------------------------------------------------------------------
// Minimal SMTP client. Mailpit accepts unauthenticated plaintext, so this is
// just the classic EHLO / MAIL FROM / RCPT TO / DATA exchange.
// ---------------------------------------------------------------------------

function smtpSend({ from, recipients, raw }) {
  return new Promise((resolve, reject) => {
    const socket = connect(SMTP_PORT, SMTP_HOST);

    // Each command goes out only after the previous reply lands. The body is
    // dot-stuffed per RFC 5321 so a line consisting of "." inside the HTML
    // cannot terminate DATA early. One RCPT TO per recipient (to + cc + bcc
    // all go here) delivers the identical raw message to everyone - which is
    // also why bcc must never appear in a header: the envelope is the only
    // place it's allowed to show up.
    const dotStuffed = raw.split(CRLF).map((line) => (line === "." ? ".." : line)).join(CRLF);

    const commands = [
      "EHLO resend-mock",
      `MAIL FROM:<${addressOnly(from)}>`,
      ...recipients.map((r) => `RCPT TO:<${addressOnly(r)}>`),
      "DATA",
      `${dotStuffed}${CRLF}.`,
      "QUIT",
    ];

    let next = 0;
    let buffer = "";
    let settled = false;

    const fail = (err) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      reject(err);
    };

    socket.setTimeout(10_000, () => fail(new Error("SMTP timeout")));
    socket.on("error", fail);
    socket.on("close", () => {
      if (settled) return;
      settled = true;
      resolve();
    });

    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");

      // Drain every complete reply currently buffered. Multi-line replies mark
      // continuations with "250-" and the final line with "250 ".
      for (;;) {
        const breakAt = buffer.indexOf(CRLF);
        if (breakAt === -1) return;

        const line = buffer.slice(0, breakAt);
        buffer = buffer.slice(breakAt + CRLF.length);

        if (line[3] === "-") continue;

        const code = Number(line.slice(0, 3));
        if (!Number.isFinite(code) || code >= 400) {
          return fail(new Error(`SMTP replied: ${line}`));
        }

        if (next >= commands.length) return;
        socket.write(commands[next++] + CRLF);
      }
    });
  });
}

/** `DOS Club <a@b.com>` -> `a@b.com`. */
function addressOnly(value) {
  const match = String(value).match(/<([^>]+)>/);
  return match ? match[1] : String(value).trim();
}

/**
 * A multipart/alternative message carrying both the text and HTML parts.
 *
 * `bcc` is deliberately not a parameter here - those recipients are RCPT TO'd
 * in the envelope (see smtpSend) and never appear in a header, exactly as a
 * real BCC must not.
 */
function buildRaw({ from, to, cc, replyTo, subject, html, text, id }) {
  const boundary = `----=_${randomUUID()}`;

  return [
    `From: ${from}`,
    `To: ${(Array.isArray(to) ? to : [to]).join(", ")}`,
    ...(cc?.length ? [`Cc: ${cc.join(", ")}`] : []),
    ...(replyTo ? [`Reply-To: ${(Array.isArray(replyTo) ? replyTo : [replyTo]).join(", ")}`] : []),
    `Subject: ${subject}`,
    `Message-ID: <${id}@resend-mock.local>`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    text ?? "",
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=utf-8",
    "",
    html ?? "",
    "",
    `--${boundary}--`,
  ].join(CRLF);
}

// ---------------------------------------------------------------------------
// Svix-signed delivery webhooks, byte-for-byte what Resend sends.
// ---------------------------------------------------------------------------

async function fireWebhook(type, emailId, to, extra = {}) {
  if (!WEBHOOK_SECRET) return;

  const body = JSON.stringify({
    type,
    created_at: new Date().toISOString(),
    data: { email_id: emailId, to: [addressOnly(to)], ...extra },
  });

  const svixId = `msg_${randomUUID()}`;
  const timestamp = Math.floor(Date.now() / 1000);

  // Resend signs `id.timestamp.body` with the base64-decoded whsec_ key.
  const key = Buffer.from(WEBHOOK_SECRET.replace(/^whsec_/, ""), "base64");
  const signature = createHmac("sha256", key)
    .update(`${svixId}.${timestamp}.${body}`)
    .digest("base64");

  try {
    const res = await fetch(`${APP_URL}/api/webhooks/resend`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "svix-id": svixId,
        "svix-timestamp": String(timestamp),
        "svix-signature": `v1,${signature}`,
      },
      body,
    });
    log(`webhook ${type} -> ${res.status}`);
  } catch (err) {
    log(`webhook ${type} failed:`, err.message);
  }
}

// ---------------------------------------------------------------------------

const server = createServer(async (req, res) => {
  const send = (status, payload) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(payload));
  };

  if (req.method === "GET" && req.url === "/health") return send(200, { ok: true });

  if (req.method !== "POST" || !req.url.startsWith("/emails")) {
    return send(404, { error: "This mock implements POST /emails only." });
  }

  let raw = "";
  for await (const chunk of req) raw += chunk;

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return send(400, { name: "validation_error", message: "Invalid JSON" });
  }

  const id = randomUUID();
  const to = Array.isArray(payload.to) ? payload.to : [payload.to];
  const cc = payload.cc ? (Array.isArray(payload.cc) ? payload.cc : [payload.cc]) : [];
  const bcc = payload.bcc ? (Array.isArray(payload.bcc) ? payload.bcc : [payload.bcc]) : [];
  const replyTo = payload.reply_to; // the SDK puts this on the wire snake_case

  log(`send "${payload.subject}" -> ${[...to, ...cc, ...bcc].join(", ")}`);

  try {
    await smtpSend({
      from: payload.from,
      recipients: [...to, ...cc, ...bcc],
      raw: buildRaw({ ...payload, to, cc, replyTo, id }),
    });
  } catch (err) {
    log("SMTP relay failed:", err.message);
    return send(500, { name: "application_error", message: err.message });
  }

  // Answer first, then let delivery events trickle in the way they really do.
  send(200, { id });

  setTimeout(() => fireWebhook("email.sent", id, to[0]), 300);
  setTimeout(() => fireWebhook("email.delivered", id, to[0]), 1500);
});

server.listen(PORT, () => log(`listening on ${PORT}, relaying to ${SMTP_HOST}:${SMTP_PORT}`));
