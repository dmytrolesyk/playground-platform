#!/bin/bash
# Generate styled PDF and DOCX from CV content
set -e

cd "$(dirname "$0")/.."

# Generate DOCX (plain, via pandoc)
cat src/content/cv/profile.md src/content/cv/experience.md src/content/cv/education.md src/content/cv/skills.md \
  | grep -v "^---$" | grep -v "^title:" | grep -v "^order:" \
  | pandoc -f markdown -o public/downloads/cv.docx

# Generate styled HTML for PDF
cat > /tmp/cv_styled.html << 'HTMLEOF'
<!DOCTYPE html>
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
  .page {
    display: flex;
    min-height: 100vh;
  }
  /* Sidebar */
  .sidebar {
    width: 200px;
    background: #1e3a5f;
    color: #e8e8e8;
    padding: 30px 18px;
    flex-shrink: 0;
  }
  .sidebar h3 {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #8bb8e8;
    margin: 20px 0 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid #2d5a8a;
  }
  .sidebar h3:first-child { margin-top: 0; }
  .sidebar ul { list-style: none; padding: 0; }
  .sidebar li {
    font-size: 10.5px;
    line-height: 1.6;
    color: #d0d8e0;
    padding: 1px 0;
  }
  .sidebar .contact-item {
    font-size: 10.5px;
    color: #d0d8e0;
    margin: 4px 0;
    word-break: break-all;
  }
  .sidebar a { color: #8bb8e8; text-decoration: none; }
  /* Main */
  .main {
    flex: 1;
    padding: 30px 28px;
  }
  .header { margin-bottom: 20px; }
  .header h1 {
    font-size: 26px;
    font-weight: 700;
    color: #1e3a5f;
    margin-bottom: 2px;
  }
  .header .subtitle {
    font-size: 14px;
    color: #4a6a8a;
    font-weight: 400;
  }
  .profile {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #ddd;
  }
  .profile p {
    font-size: 11px;
    line-height: 1.6;
    color: #333;
    margin-bottom: 6px;
  }
  .section { margin-bottom: 18px; }
  .section h2 {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #1e3a5f;
    margin-bottom: 10px;
    padding-bottom: 4px;
    border-bottom: 2px solid #1e3a5f;
  }
  .job { margin-bottom: 14px; }
  .job-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 2px;
  }
  .job-title {
    font-size: 12px;
    font-weight: 700;
    color: #1a1a1a;
  }
  .job-date {
    font-size: 10px;
    color: #666;
    font-style: italic;
    flex-shrink: 0;
  }
  .job-company {
    font-size: 11px;
    color: #4a6a8a;
    margin-bottom: 4px;
  }
  .job p {
    font-size: 11px;
    line-height: 1.5;
    color: #333;
    margin-bottom: 4px;
  }
  .job ul { padding-left: 16px; margin: 4px 0; }
  .job li {
    font-size: 10.5px;
    line-height: 1.5;
    color: #333;
    margin: 2px 0;
  }
  .edu-item { margin-bottom: 10px; }
  .edu-title { font-size: 12px; font-weight: 600; color: #1a1a1a; }
  .edu-school { font-size: 11px; color: #4a6a8a; }
  .edu-date { font-size: 10px; color: #666; font-style: italic; }
</style>
</head>
<body>
<div class="page">
  <div class="sidebar">
    <h3>Contact</h3>
    <div class="contact-item">Kyiv, Ukraine</div>
    <div class="contact-item">dmitriylesik@gmail.com</div>
    <div class="contact-item"><a href="https://linkedin.com/in/dmytro-lesyk-961599139/">LinkedIn</a></div>

    <h3>Skills</h3>
    <ul>
      <li>JavaScript / TypeScript</li>
      <li>Python</li>
      <li>React / Next.js</li>
      <li>Astro / SolidJS</li>
      <li>HTML, CSS, SCSS, Tailwind</li>
      <li>Redux / Zustand / RxJS</li>
      <li>Node.js / Fastify</li>
      <li>gRPC (ConnectRPC)</li>
      <li>MongoDB / PostgreSQL / Redis</li>
      <li>Cypress / Playwright / Vitest</li>
      <li>Webpack</li>
      <li>Material UI / Ant Design</li>
      <li>GitHub Actions / GitLab CI</li>
      <li>Figma</li>
      <li>SOLID / GRASP</li>
      <li>Web Performance</li>
      <li>Web Accessibility</li>
      <li>Codex / Claude</li>
    </ul>

    <h3>Languages</h3>
    <ul>
      <li>Ukrainian — Native</li>
      <li>English — Advanced</li>
    </ul>
  </div>

  <div class="main">
    <div class="header">
      <h1>Dmytro Lesyk</h1>
      <div class="subtitle">Frontend Engineer</div>
    </div>

    <div class="profile">
      <p>Self-taught software engineer passionate about Tech and coding. I enjoy making my life easier by optimizing and automating processes.</p>
      <p>Disciplined, organized, with solid communication skills and a great ability to learn. I thrive when I have new, complex and non-trivial problems to solve in a creative way.</p>
      <p>Always eager to learn something new and expand my toolkit. Looking forward to working with passionate and creative folks.</p>
    </div>

    <div class="section">
      <h2>Employment History</h2>

      <div class="job">
        <div class="job-header">
          <span class="job-title">Frontend Engineer</span>
          <span class="job-date">April 2019 — Present</span>
        </div>
        <div class="job-company">DataArt</div>
        <p>Global enterprise software development company. Participated in developing products across publishing, musical industry, insurance, and e-commerce.</p>
        <ul>
          <li>Built complex UI for multiple enterprise applications</li>
          <li>Built a robust publishing system with Next.js, WordPress, and JW Player (VOD + live streaming)</li>
          <li>Created a custom Cypress testing framework with automated mock gathering</li>
          <li>Optimized a Next.js app: 60% JS bundle reduction, CDN integration, Redis API caching</li>
          <li>Created custom Webpack plugins from scratch for project-specific build requirements</li>
          <li>Developed an e-commerce application with Astro and headless WooCommerce</li>
          <li>Integrated 3rd party services including payment providers</li>
          <li>Helped colleagues with client interview preparation</li>
        </ul>
      </div>

      <div class="job">
        <div class="job-header">
          <span class="job-title">Customer Support Specialist</span>
          <span class="job-date">Feb 2018 — Nov 2018</span>
        </div>
        <div class="job-company">Cloudbeds</div>
        <p>Hospitality management software. Provided customer support via phone and email.</p>
      </div>

      <div class="job">
        <div class="job-header">
          <span class="job-title">Customer Support Specialist</span>
          <span class="job-date">Jan 2015 — Oct 2017</span>
        </div>
        <div class="job-company">Namecheap</div>
        <p>ICANN-accredited domain registrar. Provided support via chat, email, and phone to global clients.</p>
      </div>
    </div>

    <div class="section">
      <h2>Education</h2>
      <div class="edu-item">
        <div class="edu-title">Master's Degree</div>
        <div class="edu-school">V.N.Karazin Kharkiv National University — Faculty of Foreign Languages</div>
        <div class="edu-date">September 2012 — February 2018</div>
      </div>
      <div class="edu-item">
        <div class="edu-title">Algorithms Course</div>
        <div class="edu-school">Projector</div>
        <div class="edu-date">March 2022 — June 2022</div>
      </div>
    </div>
  </div>
</div>
</body>
</html>
HTMLEOF

# Generate PDF via Chrome headless
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --no-sandbox \
  --print-to-pdf=public/downloads/cv.pdf \
  --no-margins \
  /tmp/cv_styled.html 2>&1 | tail -1

rm /tmp/cv_styled.html

echo "Done. PDF: $(wc -c < public/downloads/cv.pdf | tr -d ' ') bytes, DOCX: $(wc -c < public/downloads/cv.docx | tr -d ' ') bytes"
