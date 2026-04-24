import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleContactRequest } from '../../../src/pages/api/contact.ts';

const sendEmailMock = vi.fn(async () => ({ data: { id: 'email_123' }, error: null }));

vi.mock('resend', () => ({
  Resend: class {
    emails = {
      send: sendEmailMock,
    };
  },
}));

function makeJsonRequest(body: string): Request {
  return new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
}

describe('POST /api/contact', () => {
  const originalEnv = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    CONTACT_TO_EMAIL: process.env.CONTACT_TO_EMAIL,
    CONTACT_FROM_EMAIL: process.env.CONTACT_FROM_EMAIL,
  };

  beforeEach(() => {
    process.env.RESEND_API_KEY = 'test-key';
    process.env.CONTACT_TO_EMAIL = 'owner@example.com';
    process.env.CONTACT_FROM_EMAIL = 'noreply@example.com';
    sendEmailMock.mockClear();
    sendEmailMock.mockResolvedValue({ data: { id: 'email_123' }, error: null });
  });

  afterEach(() => {
    if (originalEnv.RESEND_API_KEY === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = originalEnv.RESEND_API_KEY;
    }

    if (originalEnv.CONTACT_TO_EMAIL === undefined) {
      delete process.env.CONTACT_TO_EMAIL;
    } else {
      process.env.CONTACT_TO_EMAIL = originalEnv.CONTACT_TO_EMAIL;
    }

    if (originalEnv.CONTACT_FROM_EMAIL === undefined) {
      delete process.env.CONTACT_FROM_EMAIL;
    } else {
      process.env.CONTACT_FROM_EMAIL = originalEnv.CONTACT_FROM_EMAIL;
    }
  });

  it('rejects wrong-type JSON fields instead of treating them as missing', async () => {
    const response = await handleContactRequest(
      makeJsonRequest(
        JSON.stringify({
          name: 42,
          email: 'a@b.com',
          subject: 'hi',
          message: 'x',
        }),
      ),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: 'Field "name" must be a string',
    });
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('returns the success response shape for valid string payloads', async () => {
    const response = await handleContactRequest(
      makeJsonRequest(
        JSON.stringify({
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          subject: 'Hello',
          message: '<p>Hi there</p>',
        }),
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(sendEmailMock).toHaveBeenCalledOnce();
  });

  it('rejects malformed JSON bodies', async () => {
    const response = await handleContactRequest(
      makeJsonRequest('{"name":"Ada","email":"ada@example.com"'),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: 'Malformed JSON body',
    });
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('rejects non-object JSON bodies', async () => {
    const response = await handleContactRequest(
      makeJsonRequest(JSON.stringify(['not', 'an', 'object'])),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: 'JSON body must be an object',
    });
    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});
