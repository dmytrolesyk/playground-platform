import type { JSX } from 'solid-js';
import { useDesktop } from '../store/context';
import './styles/contact-app.css';

export function ContactApp(): JSX.Element {
  const [, actions] = useDesktop();

  const telegramUser = import.meta.env.PUBLIC_TELEGRAM_USERNAME;

  const handleSendEmail = (): void => {
    actions.openWindow('email');
  };

  const handleTelegram = (): void => {
    if (telegramUser) {
      window.open(`https://t.me/${telegramUser}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div class="contact-app">
      <div class="contact-app__body">
        <p class="contact-app__text">How would you like to get in touch?</p>
        <div class="contact-app__buttons">
          <button type="button" class="contact-app__btn" onClick={handleSendEmail}>
            <span class="contact-app__btn-icon">✉</span>
            <span class="contact-app__btn-label">Send Email</span>
          </button>
          {telegramUser && (
            <button type="button" class="contact-app__btn" onClick={handleTelegram}>
              <span class="contact-app__btn-icon">💬</span>
              <span class="contact-app__btn-label">Telegram</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
