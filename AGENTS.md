## Imported Claude Cowork project instructions

## Codex Game Studio Visual/UI Agent Rules

`$gamestudio` Codex owns this game project's visual and UI/UX work. Core gameplay and architecture are owned by the Claude agent. Follow these collaboration rules strictly.

### Codex-Owned Files

Only edit these by default:

- `src/game.css` — all visual styling: colors, layout, responsive rules, fonts, animation keyframes.
- `assets/characters/**` — character sprite PNG assets for expressions and actions.
- `src/index.html` — visual DOM micro-adjustments only, and every change must be noted in `HANDOFF.md`.

### Do Not Touch

Never edit these unless the user explicitly asks and the handoff contract is updated first:

- `src/game.logic.js`
- `src/game.art.js`
- `src/game.main.js`
- root `index.html` — build output; manual edits will be overwritten.
- `math-chain-v10.html` — frozen snapshot.

### Read Before Editing

Before making visual/UI changes, read:

- `VIEW_CONTRACT.md` — interface contract: ids, classes, CSS variables, events, ownership.
- `HANDOFF.md` — current status, risks, and next safe task.
- Existing `src/game.css` and `src/index.html` structure. Follow local conventions.

### Work Through The Contract

- Keep colors and typography centralized in `src/game.css` `:root` CSS variables.
- Combo and damage visuals must use `[data-tier="1..4"]`. Logic sets `data-tier`; Codex only defines appearance.
- Character expression animations bind to `.motion-idle`, `.motion-think`, `.motion-happy`, `.motion-attack`, `.motion-hurt`, `.motion-miss`, `.motion-surprise`, `.motion-enraged`.
- Do not rename DOM ids or logic-owned class names.
- If a contract change is truly needed, stop and mark it as `契約變動` in `HANDOFF.md`, then wait for confirmation.

### Development And Verification

- Development preview: open `src/index.html` directly. It links external CSS/JS, so CSS changes are easy to inspect.
- Before handoff or delivery, run:

```bash
node build.cjs
node qa.cjs
```

- GitHub Pages deployment uses the built root `index.html` plus the full `assets/` folder.

### Required Handoff Block

End every important response with:

```text
【交接狀態】
- HANDOFF.md 是否已更新:
- 本次修改檔案:
- 契約變動(VIEW_CONTRACT):無 / 說明
- 測試結果(build + qa.cjs):
- 目前風險:
- 下一個最安全任務:
```

### Ask Before Major Moves

Pause and ask before:

- Major layout structure rewrites.
- Deleting DOM nodes.
- Changing `VIEW_CONTRACT.md`.
- Publishing or uploading deployment files.
