import { useEffect } from 'react'
import {
  useEditor,
  EditorContent,
} from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyle } from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import { FontSize } from './extensions/FontSize'

import { Bold, Italic, Strikethrough, Underline as UnderlineIcon } from 'lucide-react'

interface RichTextEditorProps {
  content: string
  placeholder?: string
  className?: string
  onChange: (html: string) => void
  onBlur?: () => void
}

function RichTextEditor({
  content,
  placeholder = 'Nhập nội dung...',
  className = '',
  onChange,
  onBlur,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // We use custom heading blocks
        codeBlock: false, // We use custom code blocks
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      TextStyle,
      FontSize,
      Underline,
    ],
    content,
    editorProps: {
      attributes: {
        class: `outline-none min-h-[1.5rem] ${className}`,
      },
    },
    onUpdate: ({ editor }) => {
      // Return HTML. If empty paragraph, return empty string to show placeholder properly if needed
      const html = editor.isEmpty ? '' : editor.getHTML()
      onChange(html)
    },
    onBlur: () => {
      onBlur?.()
    },
  })

  // Sync external content changes if needed (e.g. initial load)
  useEffect(() => {
    if (editor && content !== editor.getHTML() && !editor.isFocused) {
      // When content comes from DB (e.g. after sync) and it's different from editor
      // We only update if editor is not currently focused to avoid messing up typing
      // But actually, for live collaboration, we might need a better sync strategy.
      // For now, this is fine.
    }
  }, [content, editor])

  if (!editor) {
    return null
  }

  return (
    <>
      {editor && (
        <BubbleMenu
          editor={editor}
          className="z-50 flex items-center overflow-hidden rounded-lg border border-app-border bg-white shadow-lg"
        >
          <select
            className="h-full bg-transparent px-2 py-2 text-sm text-app-text outline-none hover:bg-app-hover cursor-pointer border-r border-app-border appearance-none"
            onChange={(e) => {
              if (e.target.value) {
                editor.chain().focus().setFontSize(e.target.value).run()
              } else {
                editor.chain().focus().unsetFontSize().run()
              }
            }}
            value={editor.getAttributes('textStyle').fontSize || ''}
            title="Cỡ chữ"
          >
            <option value="">Cỡ mặc định</option>
            <option value="12px">12px</option>
            <option value="14px">14px</option>
            <option value="16px">16px</option>
            <option value="18px">18px</option>
            <option value="20px">20px</option>
            <option value="24px">24px</option>
            <option value="30px">30px</option>
          </select>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 transition hover:bg-app-hover ${
              editor.isActive('bold') ? 'bg-app-hover text-general' : 'text-app-text'
            }`}
          >
            <Bold size={14} />
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 transition hover:bg-app-hover ${
              editor.isActive('italic') ? 'bg-app-hover text-general' : 'text-app-text'
            }`}
          >
            <Italic size={14} />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 transition hover:bg-app-hover ${
              editor.isActive('underline') ? 'bg-app-hover text-general' : 'text-app-text'
            }`}
          >
            <UnderlineIcon size={14} />
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 transition hover:bg-app-hover ${
              editor.isActive('strike') ? 'bg-app-hover text-general' : 'text-app-text'
            }`}
          >
            <Strikethrough size={14} />
          </button>
        </BubbleMenu>
      )}

      <EditorContent editor={editor} className="tiptap-wrapper w-full" />
    </>
  )
}

export default RichTextEditor
