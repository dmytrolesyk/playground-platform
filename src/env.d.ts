/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_TELEGRAM_USERNAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
