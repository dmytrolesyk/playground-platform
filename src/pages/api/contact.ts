import type { APIRoute } from 'astro';
import { Resend } from 'resend';

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
    body = (await request.json()) as ContactBody;
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

  // biome-ignore lint/complexity/useLiteralKeys: env vars use index signature
  const apiKey = import.meta.env['RESEND_API_KEY'] as string | undefined;
  // biome-ignore lint/complexity/useLiteralKeys: env vars use index signature
  const toEmail = import.meta.env['CONTACT_TO_EMAIL'] as string | undefined;
  // biome-ignore lint/complexity/useLiteralKeys: env vars use index signature
  const fromEmail = import.meta.env['CONTACT_FROM_EMAIL'] as string | undefined;

  if (!(apiKey && toEmail && fromEmail)) {
    console.error('[contact] Missing env vars:', {
      hasApiKey: Boolean(apiKey),
      hasToEmail: Boolean(toEmail),
      hasFromEmail: Boolean(fromEmail),
    });
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
    console.error('[contact] Resend error:', JSON.stringify(error));
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
