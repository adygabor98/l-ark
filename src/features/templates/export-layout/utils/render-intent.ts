/**
 * Render-intent channel shared between preview-mode's `generateHTML` calls
 * and the TipTap field-token extension.
 *
 * Why a module-level variable?
 *   `generateHTML` runs synchronously and invokes the extension's
 *   `renderHTML` during the call — so setting this right before the call
 *   and resetting right after is enough, with no context plumbing into
 *   TipTap extensions (which can't easily consume React context).
 *
 * The two valid intents:
 *   - 'design' — designer is building the template; sample/hint values are
 *     shown so the layout reads like a filled form.
 *   - 'export' — PDF capture path; blank affordances only (no placeholder
 *     literals like "Sample text", "John Doe", "DD/MM/YYYY").
 */
export type RenderIntent = 'design' | 'export';

let _currentIntent: RenderIntent = 'design';

export const setRenderIntent = (intent: RenderIntent): void => {
    _currentIntent = intent;
};

export const getRenderIntent = (): RenderIntent => _currentIntent;
