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

import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Underline as UnderlineIcon,
  Type,
  ChevronDown,
} from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'

interface RichTextEditorProps {
  content: string
  placeholder?: string
  className?: string
  onChange: (html: string) => void
  onBlur?: () => void
  onFocus?: () => void
}

function RichTextEditor({
  content,
  placeholder = 'Nhập nội dung...',
  className = '',
  onChange,
  onBlur,
  onFocus,
}: RichTextEditorProps) {
  const { translate } = useLanguage()
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // We use custom heading blocks
        codeBlock: false, // We use custom code blocks
      }),
      Placeholder.configure({
        placeholder: translate(placeholder ?? 'Nhập nội dung...'),
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
    onFocus: () => {
      onFocus?.()
    },
  })

  if (!editor) {
    return null
  }

  const fontSizeOptions = [
    { value: '', label: translate('Cỡ mặc định') },
    { value: '12px', label: '12px' },
    { value: '14px', label: '14px' },
    { value: '16px', label: '16px' },
    { value: '18px', label: '18px' },
    { value: '20px', label: '20px' },
    { value: '24px', label: '24px' },
    { value: '30px', label: '30px' },
  ]

  const currentFontSize = editor.getAttributes('textStyle').fontSize || ''

  return (
    <>
      {editor && (
        <BubbleMenu
          editor={editor}
          className="z-50 flex items-center gap-0.5 overflow-hidden rounded-xl border border-app-border bg-white p-1 shadow-lg shadow-slate-200/50"
        >
          {/* Font Size Selector */}
          <div className="group relative flex items-center">
            <button
              type="button"
              className="flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-app-text transition-colors hover:bg-app-hover"
              title={translate('Cỡ chữ')}
              onClick={() => {
                // Cycle through font sizes
                const currentIndex = fontSizeOptions.findIndex(opt => opt.value === currentFontSize)
                const nextIndex = (currentIndex + 1) % fontSizeOptions.length
                const nextSize = fontSizeOptions[nextIndex].value
                
                if (nextSize) {
                  editor.chain().focus().setFontSize(nextSize).run()
                } else {
                  editor.chain().focus().unsetFontSize().run()
                }
              }}
            >
              <Type size={14} className="text-app-muted" />
              <span className="min-w-[2rem] text-center">
                {currentFontSize ? currentFontSize.replace('px', '') : 'Aa'}
              </span>
              <ChevronDown size={12} className="text-app-muted-2" />
            </button>

            {/* Dropdown */}
            <div className="invisible absolute left-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-lg border border-app-border bg-white opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
              <div className="p-1">
                {fontSizeOptions.map((option) => {
                  const isActive = option.value === currentFontSize
                  return (
                    <button
                      key={option.value || 'default'}
                      type="button"
                      onClick={() => {
                        if (option.value) {
                          editor.chain().focus().setFontSize(option.value).run()
                        } else {
                          editor.chain().focus().unsetFontSize().run()
                        }
                      }}
                      className={`flex w-full items-center justify-between rounded-md px-3 py-1.5 text-xs transition-colors ${
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-app-text hover:bg-app-hover'
                      }`}
                    >
                      <span>{option.label}</span>
                      {isActive && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-1 h-5 w-px bg-app-border" />

          {/* Formatting Buttons */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              editor.isActive('bold') 
                ? 'bg-primary/10 text-primary' 
                : 'text-app-muted hover:bg-app-hover hover:text-app-text'
            }`}
            title="Bold"
          >
            <Bold size={14} />
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              editor.isActive('italic') 
                ? 'bg-primary/10 text-primary' 
                : 'text-app-muted hover:bg-app-hover hover:text-app-text'
            }`}
            title="Italic"
          >
            <Italic size={14} />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              editor.isActive('underline') 
                ? 'bg-primary/10 text-primary' 
                : 'text-app-muted hover:bg-app-hover hover:text-app-text'
            }`}
            title="Underline"
          >
            <UnderlineIcon size={14} />
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              editor.isActive('strike') 
                ? 'bg-primary/10 text-primary' 
                : 'text-app-muted hover:bg-app-hover hover:text-app-text'
            }`}
            title="Strikethrough"
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