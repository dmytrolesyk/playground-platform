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
  process.exitCode = hasErrors ? 1 : 0;
} catch (error) {
  process.stderr.write(`Knowledge audit crashed: ${formatError(error)}\n`);
  process.exitCode = 1;
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
