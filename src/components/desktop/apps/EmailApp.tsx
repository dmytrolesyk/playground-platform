import { createSignal, type JSX, Show } from 'solid-js';
import { isRecord } from '../../../utils/type-guards';
import './styles/email-app.css';

type FormStatus = 'idle' | 'sending' | 'success' | 'error';

function execFormat(command: string, value?: string): void {
  document.execCommand(command, false, value);
}

const FONT_SIZES: { label: string; value: string }[] = [
  { label: 'Small', value: '2' },
  { label: 'Normal', value: '3' },
  { label: 'Large', value: '4' },
  { label: 'Huge', value: '5' },
];

const TEXT_COLORS: { label: string; color: string }[] = [
  { label: 'Black', color: '#000000' },
  { label: 'Dark Red', color: '#800000' },
  { label: 'Dark Blue', color: '#000080' },
  { label: 'Dark Green', color: '#008000' },
  { label: 'Red', color: '#ff0000' },
  { label: 'Blue', color: '#0000ff' },
  { label: 'Gray', color: '#808080' },
];

export function EmailApp(): JSX.Element {
  const [name, setName] = createSignal('');
  const [email, setEmail] = createSignal('');
  const [subject, setSubject] = createSignal('');
  const [honeypot, setHoneypot] = createSignal('');
  const [status, setStatus] = createSignal<FormStatus>('idle');
  const [errorMsg, setErrorMsg] = createSignal('');

  let editorRef: HTMLDivElement | undefined;

  const telegramUser = import.meta.env.PUBLIC_TELEGRAM_USERNAME;

  const getMessage = (): string => editorRef?.innerHTML ?? '';

  const getPlainText = (): string => editorRef?.textContent?.trim() ?? '';

  const handleEmailInput: JSX.EventHandler<HTMLInputElement, InputEvent> = (
    e: InputEvent & { currentTarget: HTMLInputElement },
  ) => {
    setEmail(e.currentTarget.value);
  };

  const handleNameInput: JSX.EventHandler<HTMLInputElement, InputEvent> = (
    e: InputEvent & { currentTarget: HTMLInputElement },
  ) => {
    setName(e.currentTarget.value);
  };

  const handleSubjectInput: JSX.EventHandler<HTMLInputElement, InputEvent> = (
    e: InputEvent & { currentTarget: HTMLInputElement },
  ) => {
    setSubject(e.currentTarget.value);
  };

  const handleHoneypotInput: JSX.EventHandler<HTMLInputElement, InputEvent> = (
    e: InputEvent & { currentTarget: HTMLInputElement },
  ) => {
    setHoneypot(e.currentTarget.value);
  };

  const handleFontSizeChange: JSX.EventHandler<HTMLSelectElement, Event> = (
    e: Event & { currentTarget: HTMLSelectElement },
  ) => {
    const fontSize = e.currentTarget.value;
    if (fontSize) {
      execFormat('fontSize', fontSize);
    }
  };

  const handleSubmit = async (e: Event): Promise<void> => {
    e.preventDefault();

    if (!getPlainText()) return;

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
          message: getMessage(),
          website: honeypot(),
        }),
      });

      const raw: unknown = await res.json();
      const data =
        isRecord(raw) && typeof raw.ok === 'boolean'
          ? {
              ok: raw.ok,
              ...(typeof raw.error === 'string' && { error: raw.error }),
            }
          : { ok: false, error: 'Invalid response' };

      if (data.ok) {
        setStatus('success');
        setName('');
        setEmail('');
        setSubject('');
        if (editorRef) editorRef.innerHTML = '';
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
            onInput={handleEmailInput}
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
            onInput={handleNameInput}
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
            onInput={handleSubjectInput}
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
            onInput={handleHoneypotInput}
            tabIndex={-1}
            autocomplete="off"
          />
        </div>
      </form>

      {/* Formatting toolbar */}
      <div class="email-format-toolbar">
        <button
          type="button"
          class="email-format-btn email-format-btn--bold"
          onClick={() => execFormat('bold')}
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          class="email-format-btn email-format-btn--italic"
          onClick={() => execFormat('italic')}
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          class="email-format-btn email-format-btn--underline"
          onClick={() => execFormat('underline')}
          title="Underline"
        >
          U
        </button>

        <span class="email-format-divider" />

        <select class="email-format-select" onChange={handleFontSizeChange} title="Font size">
          {FONT_SIZES.map((s) => (
            <option value={s.value} selected={s.value === '3'}>
              {s.label}
            </option>
          ))}
        </select>

        <span class="email-format-divider" />

        <div class="email-format-colors">
          {TEXT_COLORS.map((c) => (
            <button
              type="button"
              class="email-format-color"
              style={{ background: c.color }}
              onClick={() => execFormat('foreColor', c.color)}
              title={c.label}
            />
          ))}
        </div>
      </div>

      {/* Rich text editor */}
      <div class="email-body">
        {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: contentEditable div needs aria-label */}
        <div
          ref={editorRef}
          contentEditable={true}
          class="email-body__editor"
          // biome-ignore lint/a11y/noNoninteractiveTabindex: contentEditable div needs focus
          tabIndex={0}
          aria-label="Message body"
        />
      </div>

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
