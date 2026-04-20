export interface CvSection {
  slug: string;
  title: string;
  html: string;
}

export function loadCvData(): CvSection[] {
  const el = document.getElementById('cv-data');
  if (!el?.textContent) return [];
  try {
    return JSON.parse(el.textContent) as CvSection[];
  } catch {
    return [];
  }
}
