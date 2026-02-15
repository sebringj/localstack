# Windows Setup Adaptation Prompt

Use this prompt with your AI coding assistant to adapt this project for Windows while keeping macOS support.

## Copy/Paste Prompt

I need this repo to support both macOS and Windows for local development.

Please scan the repo and make it cross-platform with minimal changes, focusing on developer startup/deploy workflows.

### Goals
- Keep existing macOS/Linux behavior working.
- Add Windows compatibility for VS Code tasks and startup/deploy scripts.
- Avoid hardcoded machine-specific paths.
- Keep commands and docs consistent.

### Files to inspect first
- .vscode/tasks.json
- scripts/start-all.sh
- scripts/deploy.sh
- scripts/stop-all.sh
- README.md

### Required changes
1. Replace hardcoded executable paths (example: /opt/homebrew/bin/localstack) with portable commands.
2. Remove Unix-only assumptions from VS Code tasks (example: chmod +x in task commands).
3. Add Windows-compatible task commands using VS Code task windows overrides.
4. Add PowerShell equivalents for shell scripts (for example: start-all.ps1, deploy.ps1, stop-all.ps1), or make tasks fully cross-platform without requiring bash.
5. Replace non-portable utilities where needed (example: shasum) with cross-platform alternatives.
6. Update README with clear macOS and Windows setup/start instructions.

### Constraints
- Keep the architecture the same.
- Do not add new product features.
- Keep edits focused on local-dev ergonomics.
- Prefer smallest practical diff.

### Validation
- Verify tasks.json is valid JSON.
- Verify VS Code tasks run on macOS and have explicit Windows command paths/overrides.
- Ensure no remaining hardcoded /opt/homebrew paths.

When done, summarize exactly what changed and list any manual prerequisites for Windows users.
