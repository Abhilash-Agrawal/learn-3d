# Project Instructions

## Preventing Regressions

- Before changing view navigation or lifecycle code, inspect every caller and definition of the affected methods. Keep method names and callback signatures consistent; do not remove a close/cleanup method while its callers remain.
- Give each view a matching, idempotent cleanup method (`dispose`) and make app-level close handlers call that method. Closing a view must remove its DOM, stop animation frames, detach event listeners, dispose its renderer, and restore the village controls exactly once.
- When changing Three.js interaction flows, validate the complete path in a browser: open the village, open a house or door, close the view, and confirm the village is interactive again. Syntax checks alone do not catch missing-method or lifecycle regressions.
- For runtime errors from generated chunk files (for example `200.js`), trace the error to the source module or source map before changing application code. Do not infer the cause from a bundled filename alone.
- After JavaScript edits, run `node --input-type=module --check` on each changed module and syntax-check all modules under `src/`.
