'use client';

import { useEffect, useRef } from 'react';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Underline,
  type LucideIcon,
} from 'lucide-react';

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const toolbarButtons: Array<{
  command: string;
  title: string;
  Icon: LucideIcon;
}> = [
  { command: 'bold', title: 'Bold', Icon: Bold },
  { command: 'italic', title: 'Italic', Icon: Italic },
  { command: 'underline', title: 'Underline', Icon: Underline },
  { command: 'insertUnorderedList', title: 'Bullet list', Icon: List },
  { command: 'insertOrderedList', title: 'Numbered list', Icon: ListOrdered },
];

export default function QuillEditor({
  value,
  onChange,
  placeholder = 'Begin typing...',
}: QuillEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastHtmlRef = useRef('');

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || document.activeElement === editor || value === lastHtmlRef.current) {
      return;
    }

    editor.innerHTML = value ?? '';
    editor.dataset.empty = value ? 'false' : 'true';
    lastHtmlRef.current = value ?? '';
  }, [value]);

  const emitChange = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const html = editor.innerHTML;
    editor.dataset.empty = editor.textContent?.trim() ? 'false' : 'true';
    lastHtmlRef.current = html;
    onChange(html);
  };

  const runCommand = (command: string) => {
    editorRef.current?.focus();
    document.execCommand(command);
    emitChange();
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-800 bg-[#0f0f0f]">
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-800 bg-[#151515] p-2">
        {toolbarButtons.map((button) => (
          <button
            key={button.command}
            type="button"
            title={button.title}
            aria-label={button.title}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand(button.command)}
            className="flex h-8 min-w-8 items-center justify-center rounded border border-gray-700 px-2 text-sm font-semibold text-gray-200 transition-colors hover:border-gray-500 hover:bg-gray-800"
          >
            <button.Icon className="h-4 w-4" aria-hidden="true" />
          </button>
        ))}
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-empty={value ? 'false' : 'true'}
        data-placeholder={placeholder}
        onInput={emitChange}
        onBlur={emitChange}
        className="min-h-[250px] px-4 py-3 text-sm leading-6 text-white outline-none empty:before:text-gray-500 [&[data-empty='true']]:before:pointer-events-none [&[data-empty='true']]:before:text-gray-500 [&[data-empty='true']]:before:content-[attr(data-placeholder)] [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6"
      />
    </div>
  );
}
