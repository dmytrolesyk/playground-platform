import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { auditKnowledgeRules } from '@playground/knowledge-engine/audit';
import { loadKnowledgeAuditInput } from '@playground/knowledge-engine/audit/load';
import {
  formatKnowledgeAuditReport,
  hasKnowledgeAuditErrors,
} from '@playground/knowledge-engine/audit/report';

try {
  const input = await loadKnowledgeAuditInput();
  const issues = auditKnowledgeRules(input);
  const report = formatKnowledgeAuditReport(issues);
  const hasErrors = hasKnowledgeAuditErrors(issues);
  const stream = hasErrors ? process.stderr : process.stdout;

  stream.write(`${report}\n`);

  // Report flagged articles (informational, not errors)
  const flagged = loadFlaggedArticles();
  if (flagged.length > 0) {
    process.stdout.write(`\nFlagged for review (${flagged.length}):\n`);
    for (const flag of flagged) {
      const reason = flag.reason ? ` — ${flag.reason}` : '';
      process.stdout.write(`  🚩 ${flag.articleId} (flagged ${flag.flaggedAt})${reason}\n`);
    }
  }

  process.exitCode = hasErrors ? 1 : 0;
} catch (error) {
  process.stderr.write(`Knowledge audit crashed: ${formatError(error)}\n`);
  process.exitCode = 1;
}

interface ReviewFlag {
  articleId: string;
  flaggedAt: string;
  reason?: string;
}

function isReviewFlag(value: unknown): value is ReviewFlag {
  return (
    typeof value === 'object' &&
    value !== null &&
    'articleId' in value &&
    typeof (value as Record<string, unknown>).articleId === 'string' &&
    'flaggedAt' in value &&
    typeof (value as Record<string, unknown>).flaggedAt === 'string'
  );
}

function loadFlaggedArticles(): ReviewFlag[] {
  const flagDir = join(process.cwd(), 'src/data/review-flags');
  try {
    return readdirSync(flagDir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        const content = readFileSync(join(flagDir, f), 'utf8');
        const parsed: unknown = JSON.parse(content);
        if (!isReviewFlag(parsed)) return null;
        return parsed;
      })
      .filter((f): f is ReviewFlag => f !== null)
      .sort((a, b) => a.articleId.localeCompare(b.articleId));
  } catch {
    return [];
  }
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
