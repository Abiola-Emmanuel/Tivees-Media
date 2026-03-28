declare module 'draftjs-to-html' {
  import type { RawDraftContentState } from 'draft-js';

  function draftToHtml(
    content: RawDraftContentState,
    hashtagConfig?: unknown,
    directional?: boolean,
    customEntityTransform?: (...args: unknown[]) => unknown
  ): string;

  export default draftToHtml;
}
