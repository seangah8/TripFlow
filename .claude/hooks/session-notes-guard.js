// Stop hook: warns (non-blocking) when source files have uncommitted changes
// newer than the most recently written session-notes step file.
// Per CLAUDE.md Section 5.4, every step ends with a summary written to
// session-notes/session-N/step-N.md. This is a warning, not a hard block,
// because Stop fires on every turn end, including turns where Claude is
// waiting on a clarifying answer per CLAUDE.md Section 5.2 (a hard block
// there would force Claude to keep generating instead of truly waiting).

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

function getChangedSourceFiles() {
  let output;
  try {
    output = execFileSync(
      'git',
      ['status', '--porcelain', '--', 'backend/src', 'frontend/src'],
      { cwd: PROJECT_ROOT, encoding: 'utf8' }
    );
  } catch {
    return [];
  }
  return output
    .split('\n')
    .filter((line) => line.length > 0)
    // porcelain lines are "XY path" or "XY orig -> renamed" — strip the
    // 3-char status prefix BEFORE any trimming, or the slice offset is wrong
    .map((line) => line.slice(3).split(' -> ').pop().trim())
    .filter(Boolean);
}

function maxMtime(files) {
  let max = 0;
  for (const rel of files) {
    const full = path.join(PROJECT_ROOT, rel);
    try {
      const mtime = fs.statSync(full).mtimeMs;
      if (mtime > max) max = mtime;
    } catch {
      // deleted file, no mtime to consider
    }
  }
  return max;
}

function findAllStepFiles(sessionNotesDir) {
  const results = [];
  let sessionDirs;
  try {
    sessionDirs = fs.readdirSync(sessionNotesDir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of sessionDirs) {
    if (!entry.isDirectory()) continue;
    const dirPath = path.join(sessionNotesDir, entry.name);
    let files;
    try {
      files = fs.readdirSync(dirPath);
    } catch {
      continue;
    }
    for (const f of files) {
      if (/^step-.*\.md$/.test(f)) {
        results.push(path.join(dirPath, f));
      }
    }
  }
  return results;
}

function main() {
  const changed = getChangedSourceFiles();
  if (changed.length === 0) {
    return; // nothing changed under backend/src or frontend/src
  }

  const sourceMaxMtime = maxMtime(changed);
  if (sourceMaxMtime === 0) {
    return; // couldn't stat any changed file (all deleted?)
  }

  const stepFiles = findAllStepFiles(path.join(PROJECT_ROOT, 'session-notes'));
  const notesMaxMtime = maxMtime(
    stepFiles.map((f) => path.relative(PROJECT_ROOT, f))
  );

  if (sourceMaxMtime > notesMaxMtime) {
    const msg =
      'Reminder (CLAUDE.md Section 5.4): backend/src or frontend/src has uncommitted changes ' +
      'newer than the latest session-notes step file. If a step just completed, post the step ' +
      'summary in chat and write session-notes/session-N/step-N.md before ending the turn. ' +
      'If this step is still in progress (e.g. waiting on a clarifying answer), ignore this.';
    process.stdout.write(JSON.stringify({ systemMessage: msg }));
  }
}

main();
