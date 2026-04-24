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

export const prerender = false;

export const POST: APIRoute = async ({ request }: { request: Request }) => {
  let body: ContactBody;
  try {
    const raw: unknown = await request.json();
    if (!isRecord(raw)) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    body = {
      ...(typeof raw.name === 'string' && { name: raw.name }),
      ...(typeof raw.email === 'string' && { email: raw.email }),
      ...(typeof raw.subject === 'string' && { subject: raw.subject }),
      ...(typeof raw.message === 'string' && { message: raw.message }),
      ...(typeof raw.website === 'string' && { website: raw.website }),
    };
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Honeypot check — silent discard
  if (body.website) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate required fields
  const name = body.name?.trim();
  const email = body.email?.trim();
  const subject = body.subject?.trim();
  const message = body.message?.trim();

  if (!(name && email && subject && message)) {
    return new Response(JSON.stringify({ ok: false, error: 'All fields are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!EMAIL_REGEX.test(email)) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid email format' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
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
    return new Response(JSON.stringify({ ok: false, error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
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
    return new Response(
      JSON.stringify({ ok: false, error: 'Failed to send email. Please try again later.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
