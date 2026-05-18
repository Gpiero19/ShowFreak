# Kilo Development Rules

## Before Starting Work

ALWAYS read:
1. .kilo/context.md
2. tasks.json
3. specs.md
4. architecture.md

## Task Selection

Choose the first TODO task where:
- dependencies are DONE
- assignedTo matches current worktree

## After Completing a Task

MANDATORY:
1. Update task status in tasks.json
2. Append entry to .kilo/journal.md
3. Create atomic git commit
4. Update context.md with:
   - completed task
   - next task
   - important discoveries

## Commit Rules

Every task MUST create:
- one atomic commit
- clear commit message:
  TASK-ID: short description

Example:
TMDB-02: implement automatic content caching

## Documentation Rules

If architecture changes:
- update architecture.md

If product behavior changes:
- update specs.md

If UI changes:
- update design.md

If implementation decisions change:
- append decisions.md

## Safety Rules

Do NOT:
- implement multiple unrelated tasks in one commit
- skip updating journal.md
- modify tasks.json without updating status