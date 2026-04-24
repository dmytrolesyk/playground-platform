import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { isRecord } from '../../utils/type-guards';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ContactBody {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  website?: string; // honeypot
}

type ParseResult<T> = { ok: true; value: T } | { ok: false; status: 400; error: string };

export const prerender = false;

function jsonResponse(body: { ok: boolean; error?: string }, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function parseOptionalStringField(
  raw: Record<string, unknown>,
  field: keyof ContactBody,
): ParseResult<string | undefined> {
  const value = raw[field];
  if (value === undefined) {
    return { ok: true, value: undefined };
  }
  if (typeof value !== 'string') {
    return { ok: false, status: 400, error: `Field "${field}" must be a string` };
  }
  return { ok: true, value };
}

async function parseContactBody(request: Request): Promise<ParseResult<ContactBody>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, status: 400, error: 'Malformed JSON body' };
  }
  if (!isRecord(raw)) {
    return { ok: false, status: 400, error: 'JSON body must be an object' };
  }

  const name = parseOptionalStringField(raw, 'name');
  if (!name.ok) return name;

  const email = parseOptionalStringField(raw, 'email');
  if (!email.ok) return email;

  const subject = parseOptionalStringField(raw, 'subject');
  if (!subject.ok) return subject;

  const message = parseOptionalStringField(raw, 'message');
  if (!message.ok) return message;

  const website = parseOptionalStringField(raw, 'website');
  if (!website.ok) return website;

  const body: ContactBody = {};
  if (name.value !== undefined) body.name = name.value;
  if (email.value !== undefined) body.email = email.value;
  if (subject.value !== undefined) body.subject = subject.value;
  if (message.value !== undefined) body.message = message.value;
  if (website.value !== undefined) body.website = website.value;

  return { ok: true, value: body };
}

export async function handleContactRequest(request: Request): Promise<Response> {
  const parsedBody = await parseContactBody(request);
  if (!parsedBody.ok) {
    return jsonResponse({ ok: false, error: parsedBody.error }, parsedBody.status);
  }

  const body = parsedBody.value;

  // Honeypot check — silent discard
  if (body.website) {
    return jsonResponse({ ok: true }, 200);
  }

  // Validate required fields
  const name = body.name?.trim();
  const email = body.email?.trim();
  const subject = body.subject?.trim();
  const message = body.message?.trim();

  if (!(name && email && subject && message)) {
    return jsonResponse({ ok: false, error: 'All fields are required' }, 400);
  }

  if (!EMAIL_REGEX.test(email)) {
    return jsonResponse({ ok: false, error: 'Invalid email format' }, 400);
  }

  // Use process.env for server-side runtime vars (not import.meta.env which Vite inlines at build time)
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;

  if (!(apiKey && toEmail && fromEmail)) {
    process.stderr.write(
      `${JSON.stringify({
        scope: 'contact',
        message: 'Missing env vars',
        hasApiKey: Boolean(apiKey),
        hasToEmail: Boolean(toEmail),
        hasFromEmail: Boolean(fromEmail),
      })}\n`,
    );
    return jsonResponse({ ok: false, error: 'Server configuration error' }, 500);
  }

  const resend = new Resend(apiKey);
  // Strip HTML tags for plain text fallback
  const plainText = message.replace(/<[^>]*>/g, '').trim();

  const { error } = await resend.emails.send({
    from: `CV Contact <${fromEmail}>`,
    to: toEmail,
    replyTo: email,
    subject: `[CV Contact] ${subject}`,
    html: `<p><strong>From:</strong> ${name} (${email})</p><hr/>${message}`,
    text: `From: ${name} (${email})\n\n${plainText}`,
  });

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ scope: 'contact', message: 'Resend error', error })}\n`,
    );
    return jsonResponse({ ok: false, error: 'Failed to send email. Please try again later.' }, 500);
  }

  return jsonResponse({ ok: true }, 200);
}

export const POST: APIRoute = ({ request }: { request: Request }) => handleContactRequest(request);
