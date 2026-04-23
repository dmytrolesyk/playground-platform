import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const CV_DIR = join(ROOT, 'src', 'content', 'cv');
const OUT_DIR = join(ROOT, 'public', 'downloads');
const PHOTO_PATH = join(ROOT, 'public', 'images', 'photo.jpg');

// -------------------------------------------------------------------
// 1. Read and parse all MD files (source of truth)
// -------------------------------------------------------------------

interface CvSection {
  slug: string;
  title: string;
  order: number;
  markdown: string;
}

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
const QUOTE_RE = /^['"]|['"]$/g;

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = raw.match(FRONTMATTER_RE);
  if (!match) return { meta: {}, body: raw };
  const meta: Record<string, string> = {};
  for (const line of (match[1] ?? '').split('\n')) {
    const sep = line.indexOf(':');
    if (sep === -1) continue;
    const key = line.slice(0, sep).trim();
    const val = line
      .slice(sep + 1)
      .trim()
      .replace(QUOTE_RE, '');
    meta[key] = val;
  }
  return { meta, body: match[2] ?? '' };
}

function loadSections(): CvSection[] {
  const files = readdirSync(CV_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort();
  const sections: CvSection[] = [];
  for (const file of files) {
    const raw = readFileSync(join(CV_DIR, file), 'utf-8');
    const { meta, body } = parseFrontmatter(raw);
    sections.push({
      slug: file.replace('.md', ''),
      // biome-ignore lint/complexity/useLiteralKeys: Record index signature
      title: meta['title'] ?? file,
      // biome-ignore lint/complexity/useLiteralKeys: Record index signature
      order: Number(meta['order'] ?? 0),
      markdown: body.trim(),
    });
  }
  return sections.sort((a, b) => a.order - b.order);
}

function mdToHtml(md: string): string {
  return execSync('pandoc -f markdown -t html', {
    input: md,
    encoding: 'utf-8',
  }).trim();
}

// -------------------------------------------------------------------
// 2. Detect Chrome binary
// -------------------------------------------------------------------

function findChrome(): string {
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'google-chrome-stable',
    'google-chrome',
    'chromium-browser',
    'chromium',
  ];
  for (const c of candidates) {
    try {
      execSync(`"${c}" --version`, { stdio: 'ignore' });
      return c;
    } catch {
      // continue
    }
  }
  throw new Error('Chrome not found. Install Chrome or Chromium for PDF generation.');
}

// -------------------------------------------------------------------
// 3. Encode photo as base64 for embedding in HTML
// -------------------------------------------------------------------

function photoBase64(): string {
  if (!existsSync(PHOTO_PATH)) return '';
  const buf = readFileSync(PHOTO_PATH);
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

// -------------------------------------------------------------------
// 4. Build the styled HTML for PDF (two-column layout)
// -------------------------------------------------------------------

function buildPdfHtml(sections: CvSection[]): string {
  const profile = sections.find((s) => s.slug === 'profile');
  const experience = sections.find((s) => s.slug === 'experience');
  const education = sections.find((s) => s.slug === 'education');
  const skills = sections.find((s) => s.slug === 'skills');

  const photo = photoBase64();

  // Parse skills markdown into structured lists for sidebar
  const skillsHtml = skills ? mdToHtml(skills.markdown) : '';
  const profileHtml = profile ? mdToHtml(profile.markdown) : '';
  const experienceHtml = experience ? mdToHtml(experience.markdown) : '';
  const educationHtml = education ? mdToHtml(education.markdown) : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 11px;
    line-height: 1.5;
    color: #1a1a1a;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page { display: flex; min-height: 100vh; }

  /* Sidebar */
  .sidebar {
    width: 210px;
    background: #1e3a5f;
    color: #e8e8e8;
    padding: 28px 18px;
    flex-shrink: 0;
  }
  .sidebar-photo {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #8bb8e8;
    display: block;
    margin: 0 auto 16px;
  }
  .sidebar h2 {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #8bb8e8;
    margin: 18px 0 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid #2d5a8a;
  }
  .sidebar h2:first-of-type { margin-top: 0; }
  .sidebar ul { list-style: none; padding: 0; }
  .sidebar li { font-size: 10.5px; line-height: 1.6; color: #d0d8e0; padding: 1px 0; }
  .sidebar p { font-size: 10.5px; line-height: 1.6; color: #d0d8e0; margin: 2px 0; }
  .sidebar strong { color: #e8e8e8; font-weight: 600; }
  .sidebar a { color: #8bb8e8; text-decoration: none; }

  /* Main */
  .main { flex: 1; padding: 28px 26px; }
  .main h2 {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #1e3a5f;
    margin: 18px 0 8px;
    padding-bottom: 4px;
    border-bottom: 2px solid #1e3a5f;
  }
  .main h2:first-child { margin-top: 0; }
  .main h3 { font-size: 12px; font-weight: 700; color: #1a1a1a; margin: 12px 0 2px; }
  .main p { font-size: 11px; line-height: 1.6; color: #333; margin: 3px 0; }
  .main em { color: #555; }
  .main strong { color: #000; }
  .main ul { padding-left: 16px; margin: 4px 0; }
  .main li { font-size: 10.5px; line-height: 1.5; color: #333; margin: 2px 0; }

  .header { margin-bottom: 16px; }
  .header h1 { font-size: 26px; font-weight: 700; color: #1e3a5f; margin: 0 0 2px; }
  .header-subtitle { font-size: 14px; color: #4a6a8a; margin: 0; }
  .profile-text { margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px solid #ddd; }
</style>
</head>
<body>
<div class="page">
  <div class="sidebar">
    ${photo ? `<img src="${photo}" class="sidebar-photo" alt="Dmytro Lesyk" />` : ''}
    ${skillsHtml}
  </div>
  <div class="main">
    <div class="header">
      ${profileHtml}
    </div>
    ${experienceHtml}
    ${educationHtml}
  </div>
</div>
</body>
</html>`;
}

// -------------------------------------------------------------------
// 5. Build combined markdown for DOCX (all sections, with photo)
// -------------------------------------------------------------------

function buildDocxMarkdown(sections: CvSection[]): string {
  const parts: string[] = [];

  // Add photo at the top
  if (existsSync(PHOTO_PATH)) {
    parts.push(`![Dmytro Lesyk](${PHOTO_PATH}){ width=80px }\n`);
  }

  for (const section of sections) {
    parts.push(section.markdown);
    parts.push(''); // blank line between sections
  }

  return parts.join('\n\n');
}

// -------------------------------------------------------------------
// 6. Generate outputs
// -------------------------------------------------------------------

function main(): void {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const sections = loadSections();
  process.stdout.write(
    `Loaded ${sections.length} CV sections: ${sections.map((s) => s.slug).join(', ')}\n`,
  );

  // PDF
  const html = buildPdfHtml(sections);
  const tmpHtml = join(OUT_DIR, '_cv_tmp.html');
  writeFileSync(tmpHtml, html);

  const chrome = findChrome();
  process.stdout.write(`Using Chrome: ${chrome}\n`);

  execSync(
    `"${chrome}" --headless --disable-gpu --no-sandbox --print-to-pdf="${join(OUT_DIR, 'cv.pdf')}" --no-margins "${tmpHtml}"`,
    { stdio: 'inherit' },
  );
  execSync(`rm "${tmpHtml}"`);

  // DOCX
  const docxMd = buildDocxMarkdown(sections);
  const tmpMd = join(OUT_DIR, '_cv_tmp.md');
  writeFileSync(tmpMd, docxMd);

  execSync(`pandoc "${tmpMd}" -f markdown -o "${join(OUT_DIR, 'cv.docx')}"`, { stdio: 'inherit' });
  execSync(`rm "${tmpMd}"`);

  const pdfSize = readFileSync(join(OUT_DIR, 'cv.pdf')).length;
  const docxSize = readFileSync(join(OUT_DIR, 'cv.docx')).length;
  process.stdout.write(`Done. PDF: ${pdfSize} bytes, DOCX: ${docxSize} bytes\n`);
}

main();
