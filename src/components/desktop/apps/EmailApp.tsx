import { createSignal, type JSX, Show } from 'solid-js';
import './styles/email-app.css';

type FormStatus = 'idle' | 'sending' | 'success' | 'error';

export function EmailApp(): JSX.Element {
  const [name, setName] = createSignal('');
  const [email, setEmail] = createSignal('');
  const [subject, setSubject] = createSignal('');
  const [message, setMessage] = createSignal('');
  const [honeypot, setHoneypot] = createSignal('');
  const [status, setStatus] = createSignal<FormStatus>('idle');
  const [errorMsg, setErrorMsg] = createSignal('');

  // biome-ignore lint/complexity/useLiteralKeys: env var from build
  const telegramUser = import.meta.env['PUBLIC_TELEGRAM_USERNAME'] as string | undefined;

  const handleSubmit = async (e: Event): Promise<void> => {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name(),
          email: email(),
          subject: subject(),
          message: message(),
          website: honeypot(),
        }),
      });

      const data = (await res.json()) as { ok: boolean; error?: string };

      if (data.ok) {
        setStatus('success');
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        setStatus('error');
        setErrorMsg(data.error ?? 'Failed to send message');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Network error. Please try again.');
    }
  };

  const handleDialogClose = (): void => {
    setStatus('idle');
  };

  return (
    <div class="email-app">
      {/* Toolbar */}
      <div class="email-toolbar">
        <button
          type="button"
          class="email-toolbar__send-btn"
          onClick={handleSubmit}
          disabled={status() === 'sending'}
        >
          ✉ Send
        </button>
        <Show when={telegramUser}>
          <a
            href={`https://t.me/${telegramUser}`}
            target="_blank"
            rel="noopener noreferrer"
            class="email-toolbar__telegram-btn"
          >
            💬 Telegram
          </a>
        </Show>
      </div>

      {/* Form fields */}
      <form class="email-form" onSubmit={handleSubmit}>
        <div class="email-field">
          <label class="email-field__label" for="email-to">
            To:
          </label>
          <input
            id="email-to"
            type="text"
            value="dmitriylesik@gmail.com"
            readOnly={true}
            class="email-field__input"
          />
        </div>
        <div class="email-field">
          <label class="email-field__label" for="email-from">
            From:
          </label>
          <input
            id="email-from"
            type="email"
            value={email()}
            onInput={(e: InputEvent) => setEmail((e.target as HTMLInputElement).value)}
            placeholder="your@email.com"
            required={true}
            class="email-field__input"
          />
        </div>
        <div class="email-field">
          <label class="email-field__label" for="email-name">
            Name:
          </label>
          <input
            id="email-name"
            type="text"
            value={name()}
            onInput={(e: InputEvent) => setName((e.target as HTMLInputElement).value)}
            placeholder="Your name"
            required={true}
            class="email-field__input"
          />
        </div>
        <div class="email-field">
          <label class="email-field__label" for="email-subject">
            Subject:
          </label>
          <input
            id="email-subject"
            type="text"
            value={subject()}
            onInput={(e: InputEvent) => setSubject((e.target as HTMLInputElement).value)}
            placeholder="Subject"
            required={true}
            class="email-field__input"
          />
        </div>

        {/* Honeypot — hidden from users */}
        <div style={{ display: 'none' }} aria-hidden="true">
          <input
            type="text"
            name="website"
            value={honeypot()}
            onInput={(e: InputEvent) => setHoneypot((e.target as HTMLInputElement).value)}
            tabIndex={-1}
            autocomplete="off"
          />
        </div>

        <div class="email-body">
          <textarea
            value={message()}
            onInput={(e: InputEvent) => setMessage((e.target as HTMLTextAreaElement).value)}
            placeholder="Write your message here..."
            required={true}
            class="email-body__textarea"
          />
        </div>
      </form>

      {/* Dialog overlays */}
      <Show when={status() === 'success'}>
        <div class="email-dialog-overlay">
          <div class="window email-dialog">
            <div class="title-bar">
              <div class="title-bar-text">Message Sent</div>
            </div>
            <div class="window-body" style={{ padding: '16px' }}>
              <p style={{ margin: '0 0 16px' }}>✅ Your message has been sent successfully!</p>
              <div style={{ 'text-align': 'right' }}>
                <button type="button" onClick={handleDialogClose}>
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      </Show>

      <Show when={status() === 'error'}>
        <div class="email-dialog-overlay">
          <div class="window email-dialog">
            <div class="title-bar">
              <div class="title-bar-text">Error</div>
            </div>
            <div class="window-body" style={{ padding: '16px' }}>
              <p style={{ margin: '0 0 16px' }}>❌ {errorMsg()}</p>
              <div style={{ 'text-align': 'right' }}>
                <button type="button" onClick={handleDialogClose}>
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      </Show>

      {/* Status bar */}
      <div class="status-bar">
        <p class="status-bar-field">{status() === 'sending' ? 'Sending...' : 'Ready'}</p>
      </div>
    </div>
  );
}
