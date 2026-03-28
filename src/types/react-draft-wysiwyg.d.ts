declare module "react-draft-wysiwyg" {
  import type { ComponentType } from "react";
  import type { EditorState } from "draft-js";

  export interface EditorProps {
    editorState?: EditorState;
    toolbarClassName?: string;
    wrapperClassName?: string;
    editorClassName?: string;
    onEditorStateChange?: (editorState: EditorState) => void;
    placeholder?: string;
    toolbar?: Record<string, unknown>;
    [key: string]: unknown;
  }

  export const Editor: ComponentType<EditorProps>;
}
