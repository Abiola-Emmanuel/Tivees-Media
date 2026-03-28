'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { EditorState, convertToRaw } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import { stateFromHTML } from 'draft-js-import-html';

// Dynamically import Editor to avoid SSR issues
const Editor = dynamic(
  () => import('react-draft-wysiwyg').then((mod) => mod.Editor),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full bg-[#0f0f0f] border border-gray-800 rounded-lg flex items-center justify-center">
        <p className="text-gray-400">Loading editor...</p>
      </div>
    ),
  }
);

// Import CSS
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function QuillEditor({ value, onChange, placeholder }: QuillEditorProps) {
  const [editorState, setEditorState] = useState(() => EditorState.createEmpty());
  const isInitialized = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized.current) {
      if (value) {
        try {
          const contentState = stateFromHTML(value);
          setEditorState(EditorState.createWithContent(contentState));
        } catch (error) {
          console.error('Error parsing HTML:', error);
          setEditorState(EditorState.createEmpty());
        }
      }
      isInitialized.current = true;
    }
  }, [value]);

  const onEditorStateChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState);
    const html = draftToHtml(convertToRaw(newEditorState.getCurrentContent()));
    onChange(html);
  };

  return (
    <div className="draft-editor-wrapper" style={{ height: '300px', display: 'flex', flexDirection: 'column' }}>
      <Editor
        editorState={editorState}
        toolbarClassName="draft-toolbar"
        wrapperClassName="draft-wrapper"
        editorClassName="draft-editor"
        onEditorStateChange={onEditorStateChange}
        placeholder={placeholder || 'Begin typing...'}
        toolbar={{
          options: ['inline', 'blockType', 'fontSize', 'fontFamily', 'list', 'textAlign', 'link', 'emoji', 'image', 'remove', 'history'],
          inline: {
            inDropdown: false,
            options: ['bold', 'italic', 'underline', 'strikethrough', 'monospace', 'superscript', 'subscript'],
          },
          blockType: {
            inDropdown: true,
            options: ['Normal', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'Blockquote', 'Code'],
          },
          fontSize: {
            options: [8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 24, 30, 36, 48, 60, 72, 96],
          },
          fontFamily: {
            options: ['Arial', 'Georgia', 'Impact', 'Tahoma', 'Times New Roman', 'Verdana'],
          },
          list: {
            inDropdown: false,
            options: ['unordered', 'ordered', 'indent', 'outdent'],
          },
          textAlign: {
            inDropdown: false,
            options: ['left', 'center', 'right', 'justify'],
          },
          link: {
            inDropdown: false,
            showOpenOptionOnHover: true,
            defaultTargetOption: '_self',
            options: ['link', 'unlink'],
          },
        }}
      />
    </div>
  );
}
