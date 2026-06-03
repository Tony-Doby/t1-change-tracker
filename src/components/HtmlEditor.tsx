import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Bold, Italic, Underline, Link, AlignLeft, AlignCenter, AlignRight,
  Type, Code, Eye, ChevronDown, Undo2
} from 'lucide-react'
import DOMPurify from 'dompurify'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholders?: string[]
  previewData?: Record<string, string>
  height?: string
  readOnly?: boolean
}

type Mode = 'visual' | 'code' | 'preview'

const defaultPlaceholders = [
  '{{agentName}}', '{{staffId}}', '{{oldT1Name}}', '{{oldT1Email}}',
  '{{newT1Name}}', '{{newT1Email}}', '{{newT1StaffId}}', '{{date}}',
  '{{deadlineDate}}', '{{notifyDate}}', '{{tempT1Name}}',
]

function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'u', 'a', 'div', 'span', 'strong', 'em',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'font',
    ],
    ALLOWED_ATTR: ['href', 'target', 'style', 'color', 'size', 'face', 'align'],
  }) as string
}

export function plainTextToHtml(text: string): string {
  if (!text) return ''
  if (/<[a-z][\s\S]*>/i.test(text)) return text
  return text
    .split('\n\n')
    .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('')
}

export default function HtmlEditor({
  value,
  onChange,
  placeholders = defaultPlaceholders,
  previewData,
  height = '280px',
  readOnly = false,
}: Props) {
  const [mode, setMode] = useState<Mode>('visual')
  const [showPlaceholderMenu, setShowPlaceholderMenu] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const colorInputRef = useRef<HTMLInputElement>(null)
  const isInternalChangeRef = useRef(false)

  // Sync editor content when switching to visual mode or when value changes from outside
  useEffect(() => {
    if (mode === 'visual' && editorRef.current && !isInternalChangeRef.current) {
      const next = plainTextToHtml(value)
      if (editorRef.current.innerHTML !== next) {
        editorRef.current.innerHTML = next
      }
    }
    isInternalChangeRef.current = false
  }, [mode, value])

  const exec = useCallback((command: string, valueArg: string = '') => {
    document.execCommand(command, false, valueArg)
    if (editorRef.current) {
      isInternalChangeRef.current = true
      onChange(sanitizeHtml(editorRef.current.innerHTML))
    }
  }, [onChange])

  const insertPlaceholder = useCallback((ph: string) => {
    if (mode !== 'visual' || !editorRef.current) return
    editorRef.current.focus()
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      const textNode = document.createTextNode(ph)
      range.deleteContents()
      range.insertNode(textNode)
      range.setStartAfter(textNode)
      range.collapse(true)
      sel.removeAllRanges()
      sel.addRange(range)
      isInternalChangeRef.current = true
      onChange(sanitizeHtml(editorRef.current.innerHTML))
    }
    setShowPlaceholderMenu(false)
  }, [mode, onChange])

  const handleEditorInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChangeRef.current = true
      onChange(sanitizeHtml(editorRef.current.innerHTML))
    }
  }, [onChange])

  const getPreviewHtml = () => {
    const html = plainTextToHtml(value)
    if (!previewData) return sanitizeHtml(html)
    let result = html
    Object.entries(previewData).forEach(([key, val]) => {
      result = result.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), val)
    })
    return sanitizeHtml(result)
  }

  const ToolbarButton = ({
    onClick,
    active,
    children,
    title,
  }: {
    onClick: () => void
    active?: boolean
    children: React.ReactNode
    title?: string
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`h-8 w-8 flex items-center justify-center rounded text-neutral-600 hover:bg-neutral-100 transition-colors ${active ? 'bg-neutral-100 text-primary' : ''}`}
    >
      {children}
    </button>
  )

  return (
    <div className="border border-neutral-300 rounded-md overflow-hidden bg-white">
      {/* Tabs */}
      <div className="flex items-center border-b border-neutral-200 bg-neutral-50">
        {!readOnly && (
          <div className="flex">
            <button
              type="button"
              onClick={() => setMode('visual')}
              className={`px-3 h-9 text-xs font-medium flex items-center gap-1.5 border-r border-neutral-200 ${mode === 'visual' ? 'bg-white text-primary' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              <Type className="w-3.5 h-3.5" /> Soạn thảo
            </button>
            <button
              type="button"
              onClick={() => setMode('code')}
              className={`px-3 h-9 text-xs font-medium flex items-center gap-1.5 border-r border-neutral-200 ${mode === 'code' ? 'bg-white text-primary' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              <Code className="w-3.5 h-3.5" /> Code
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => setMode('preview')}
          className={`px-3 h-9 text-xs font-medium flex items-center gap-1.5 ${mode === 'preview' ? 'bg-white text-primary' : 'text-neutral-500 hover:text-neutral-700'} ${readOnly ? '' : 'border-r border-neutral-200'}`}
        >
          <Eye className="w-3.5 h-3.5" /> Xem trước
        </button>
      </div>

      {/* Toolbar (visual only) */}
      {mode === 'visual' && !readOnly && (
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-neutral-200 flex-wrap">
          <ToolbarButton onClick={() => exec('bold')} title="Bold"><Bold className="w-3.5 h-3.5" /></ToolbarButton>
          <ToolbarButton onClick={() => exec('italic')} title="Italic"><Italic className="w-3.5 h-3.5" /></ToolbarButton>
          <ToolbarButton onClick={() => exec('underline')} title="Underline"><Underline className="w-3.5 h-3.5" /></ToolbarButton>
          <div className="w-px h-5 bg-neutral-200 mx-1" />
          <ToolbarButton onClick={() => {
            const url = prompt('Nhập URL:')
            if (url) exec('createLink', url)
          }} title="Link"><Link className="w-3.5 h-3.5" /></ToolbarButton>
          <ToolbarButton onClick={() => colorInputRef.current?.click()} title="Màu chữ"><Type className="w-3.5 h-3.5" /></ToolbarButton>
          <input
            ref={colorInputRef}
            type="color"
            className="sr-only"
            onChange={(e) => exec('foreColor', e.target.value)}
          />
          <div className="w-px h-5 bg-neutral-200 mx-1" />
          <ToolbarButton onClick={() => exec('justifyLeft')} title="Căn trái"><AlignLeft className="w-3.5 h-3.5" /></ToolbarButton>
          <ToolbarButton onClick={() => exec('justifyCenter')} title="Căn giữa"><AlignCenter className="w-3.5 h-3.5" /></ToolbarButton>
          <ToolbarButton onClick={() => exec('justifyRight')} title="Căn phải"><AlignRight className="w-3.5 h-3.5" /></ToolbarButton>
          <div className="w-px h-5 bg-neutral-200 mx-1" />
          <ToolbarButton onClick={() => exec('undo')} title="Hoàn tác"><Undo2 className="w-3.5 h-3.5" /></ToolbarButton>
          <div className="w-px h-5 bg-neutral-200 mx-1" />
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPlaceholderMenu((v) => !v)}
              className="h-8 px-2 flex items-center gap-1 rounded text-xs text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              Chèn placeholder <ChevronDown className="w-3 h-3" />
            </button>
            {showPlaceholderMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowPlaceholderMenu(false)} />
                <div className="absolute z-20 top-full left-0 mt-1 bg-white border border-neutral-200 rounded-md shadow-lg py-1 min-w-[160px]">
                  {placeholders.map((ph) => (
                    <button
                      key={ph}
                      type="button"
                      onClick={() => insertPlaceholder(ph)}
                      className="w-full text-left px-3 py-1.5 text-xs text-neutral-700 hover:bg-primary-light hover:text-primary transition-colors"
                    >
                      {ph}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Editor area */}
      <div style={{ height }}>
        {mode === 'visual' && (
          <div
            ref={editorRef}
            contentEditable={!readOnly}
            suppressContentEditableWarning
            onInput={handleEditorInput}
            className="w-full h-full px-3 py-2 text-sm text-neutral-800 outline-none overflow-y-auto leading-relaxed"
          />
        )}
        {mode === 'code' && (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full px-3 py-2 text-xs font-mono text-neutral-800 outline-none resize-none bg-neutral-50"
            spellCheck={false}
          />
        )}
        {mode === 'preview' && (
          <div
            className="w-full h-full px-3 py-2 text-sm text-neutral-800 overflow-y-auto leading-relaxed bg-white"
            dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
          />
        )}
      </div>
    </div>
  )
}
