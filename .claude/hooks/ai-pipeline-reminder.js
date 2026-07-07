// PostToolUse hook (Edit|Write): reminds to run /test-ai-pipeline when a
// change touches one of the AI pipeline files listed in CLAUDE.md Section 5.6.
// Non-blocking — just a visible reminder.

const path = require('path');

const PIPELINE_FILES = [
  'backend/src/api/services/placeService.ts',
  'backend/src/api/services/claudeService.ts',
  'backend/src/api/services/tripService.ts',
  'backend/src/utils/clustering.ts',
];

function readStdin() {
  try {
    return require('fs').readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function main() {
  const raw = readStdin();
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return;
  }

  const filePath =
    input?.tool_response?.filePath || input?.tool_input?.file_path || '';
  if (!filePath) return;

  const normalized = filePath.replace(/\\/g, '/');
  const matched = PIPELINE_FILES.some((f) => normalized.endsWith(f));
  if (!matched) return;

  const msg = `Reminder (CLAUDE.md Section 5.6): ${path.basename(
    filePath
  )} is part of the AI pipeline — run /test-ai-pipeline after this change.`;
  process.stdout.write(JSON.stringify({ systemMessage: msg }));
}

main();
