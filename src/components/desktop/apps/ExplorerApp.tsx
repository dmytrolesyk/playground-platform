import type { JSX } from 'solid-js';
import './styles/explorer-app.css';

interface FileEntry {
  name: string;
  icon: string;
  href: string;
  size: string;
}

const FILES: FileEntry[] = [
  { name: 'CV.pdf', icon: '/icons/pdf_icon.png', href: '/downloads/cv.pdf', size: '88 KB' },
  { name: 'CV.docx', icon: '/icons/doc_icon.png', href: '/downloads/cv.docx', size: '11 KB' },
];

export function ExplorerApp(): JSX.Element {
  return (
    <div class="explorer-app">
      {/* Toolbar */}
      <div class="explorer-toolbar">
        <div class="explorer-toolbar__buttons">
          <button type="button" disabled={true}>
            ← Back
          </button>
          <button type="button" disabled={true}>
            → Fwd
          </button>
          <button type="button" disabled={true}>
            ↑ Up
          </button>
        </div>
        <div class="explorer-toolbar__address">
          <span class="explorer-toolbar__label">Address</span>
          <input
            type="text"
            value="C:\My Documents\CV\"
            readOnly={true}
            class="explorer-toolbar__input"
          />
        </div>
      </div>

      {/* File grid */}
      <div class="explorer-files">
        {FILES.map((file: FileEntry) => (
          <a href={file.href} download={file.name} class="explorer-file">
            <img
              src={file.icon}
              alt=""
              width={32}
              height={32}
              style={{ 'image-rendering': 'pixelated' }}
              draggable={false}
            />
            <span class="explorer-file__name">{file.name}</span>
          </a>
        ))}
      </div>

      {/* Status bar */}
      <div class="status-bar">
        <p class="status-bar-field">{FILES.length} object(s)</p>
      </div>
    </div>
  );
}
