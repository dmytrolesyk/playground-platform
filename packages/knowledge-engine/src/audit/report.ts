import type { KnowledgeAuditIssue } from './types.ts';

export function formatKnowledgeAuditReport(issues: readonly KnowledgeAuditIssue[]): string {
  const errors = issues.filter((issue) => issue.severity === 'error');
  const warnings = issues.filter((issue) => issue.severity === 'warning');

  if (issues.length === 0) {
    return 'Knowledge audit passed with 0 issues.';
  }

  const status = errors.length > 0 ? 'failed' : 'completed';
  const lines = [
    `Knowledge audit ${status} with ${formatCount(issues.length, 'issue')}:`,
    ...issues.map((issue) => `- [${issue.code}] ${issue.subject}: ${issue.message}`),
  ];

  if (warnings.length > 0 && errors.length > 0) {
    lines.push(`Warnings: ${warnings.length}`);
  }

  return lines.join('\n');
}

export function hasKnowledgeAuditErrors(issues: readonly KnowledgeAuditIssue[]): boolean {
  return issues.some((issue) => issue.severity === 'error');
}

function formatCount(count: number, label: string): string {
  return `${count} ${label}${count === 1 ? '' : 's'}`;
}
