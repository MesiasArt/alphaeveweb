import { EmailMessage } from "cloudflare:email";

const SERVICES = [
  "Illustration",
  "Comics & Manga",
  "Character Design",
  "Concept Art",
  "Graphic Design",
  "Visual Development",
  "Game Art",
  "Other",
];

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const recentRequests = new Map();

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/contact") return handleContact(request, env);
    return env.ASSETS.fetch(request);
  },
};

async function handleContact(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method !== "POST") {
    return json({ ok: false, error: "Method not allowed." }, 405);
  }
  if (!sameSite(request)) {
    return json({ ok: false, error: "This form can only be submitted from the Alpha Eve website." }, 403);
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  if (isRateLimited(ip)) {
    return json({ ok: false, error: "Too many inquiries from this connection. Please try again later." }, 429);
  }

  const length = Number(request.headers.get("content-length") || 0);
  if (length > 32000) {
    return json({ ok: false, error: "Message is too long." }, 413);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "The inquiry could not be read." }, 400);
  }

  if (singleLine(payload?.confirm_url, 200)) {
    return json({ ok: true });
  }

  const inquiry = validate(payload);
  if (inquiry.error) return json({ ok: false, error: inquiry.error }, 400);

  const to = singleLine(env.CONTACT_TO, 200);
  const from = singleLine(env.CONTACT_FROM, 200);
  if (!to || !from || !env.EMAIL?.send) {
    return json({ ok: false, error: "Contact email is not configured yet." }, 503);
  }

  try {
    await env.EMAIL.send(new EmailMessage(from, to, mimeMessage({ from, to, inquiry })));
  } catch (error) {
    console.error("Contact email failed", error);
    return json({ ok: false, error: "We couldn't send your inquiry. Please try again." }, 502);
  }

  return json({ ok: true });
}

function validate(payload) {
  const name = singleLine(payload?.name, 120);
  const email = singleLine(payload?.email, 200).toLowerCase();
  const company = singleLine(payload?.company, 160);
  const service = singleLine(payload?.service, 80);
  const description = clean(payload?.description, 4000);
  const budget = singleLine(payload?.budget, 120);
  const timeline = singleLine(payload?.timeline, 120);
  const reference = singleLine(payload?.reference, 300);

  if (name.length < 2) return { error: "Please enter your name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Please enter a valid email address." };
  if (!SERVICES.includes(service)) return { error: "Please select a service." };
  if (description.length < 10) return { error: "Please describe the project in a little more detail." };
  if (reference && !isHttpUrl(reference)) return { error: "The reference must be a full http or https URL." };

  return { name, email, company, service, description, budget, timeline, reference };
}

function mimeMessage({ from, to, inquiry }) {
  const subject = encodeHeader(`New project inquiry — ${inquiry.name}`);
  const lines = [
    `Name: ${inquiry.name}`,
    `Email: ${inquiry.email}`,
    `Company / Organization: ${inquiry.company || "—"}`,
    `Service: ${inquiry.service}`,
    `Budget range: ${inquiry.budget || "—"}`,
    `Timeline: ${inquiry.timeline || "—"}`,
    `Website / reference: ${inquiry.reference || "—"}`,
    "",
    "Project description:",
    inquiry.description,
  ];
  return [
    `From: ${from}`,
    `To: ${to}`,
    `Reply-To: ${inquiry.email}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    lines.join("\r\n"),
  ].join("\r\n");
}

function encodeHeader(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `=?UTF-8?B?${btoa(binary)}?=`;
}

function clean(value, max) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

function singleLine(value, max) {
  return clean(value, max).replace(/[\r\n]+/g, " ");
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function sameSite(request) {
  const site = request.headers.get("Sec-Fetch-Site");
  if (site && site !== "same-origin" && site !== "none") return false;
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (recentRequests.get(ip) || []).filter(time => now - time < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    recentRequests.set(ip, recent);
    return true;
  }
  recent.push(now);
  recentRequests.set(ip, recent);
  if (recentRequests.size > 2000) {
    for (const [key, times] of recentRequests) {
      if (times.every(time => now - time >= WINDOW_MS)) recentRequests.delete(key);
    }
  }
  return false;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    vary: "Origin",
  };
}
