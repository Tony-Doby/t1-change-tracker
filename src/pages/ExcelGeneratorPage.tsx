import { useState, useEffect, useCallback } from 'react'
import { FileSpreadsheet } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import GeneratePanel from '../components/excel-generator/GeneratePanel'
import GenerationHistory from '../components/excel-generator/GenerationHistory'
import TemplateManager from '../components/excel-generator/TemplateManager'
import type { ExcelTemplate, ExcelGenerationLog } from '../types'

type TabKey = 'generate' | 'history' | 'templates'

export default function ExcelGeneratorPage() {
  const { user } = useAuth()
  const { show } = useToast()
  const [activeTab, setActiveTab] = useState<TabKey>('generate')
  const [templates, setTemplates] = useState<ExcelTemplate[]>([])
  const [logs, setLogs] = useState<ExcelGenerationLog[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [loadingLogs, setLoadingLogs] = useState(false)

  const isAdmin = user?.role === 'admin'

  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true)
    const { data, error } = await supabase
      .from('excel_templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      show('Lỗi tải templates: ' + error.message, 'error')
    } else {
      setTemplates(
        (data ?? []).map((t) => {
          const rawMapping = t.column_mapping && typeof t.column_mapping === 'object' ? t.column_mapping : {}
          const parsedMapping: Record<string, { type: 'column' | 'fixed'; value: string }> = {}
          for (const [k, v] of Object.entries(rawMapping)) {
            if (v && typeof v === 'object' && 'type' in v && 'value' in v) {
              parsedMapping[k] = v as { type: 'column' | 'fixed'; value: string }
            }
          }
          return {
            ...t,
            template_header_row: typeof t.template_header_row === 'number' ? t.template_header_row : 0,
            import_header_row: typeof t.import_header_row === 'number' ? t.import_header_row : 0,
            fields: Array.isArray(t.fields) ? t.fields : [],
            import_headers: Array.isArray(t.import_headers) ? t.import_headers : [],
            column_mapping: parsedMapping,
          } as ExcelTemplate
        })
      )
    }
    setLoadingTemplates(false)
  }, [show])

  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true)
    const { data, error } = await supabase
      .from('excel_generation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      show('Lỗi tải lịch sử: ' + error.message, 'error')
    } else {
      setLogs(
        (data ?? []).map((l) => ({
          ...l,
          matched_placeholders: Array.isArray(l.matched_placeholders) ? l.matched_placeholders : [],
        })) as ExcelGenerationLog[]
      )
    }
    setLoadingLogs(false)
  }, [show])

  useEffect(() => {
    fetchTemplates()
    fetchLogs()
  }, [fetchTemplates, fetchLogs])

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'generate', label: 'Generate' },
    { key: 'history', label: 'Lịch sử' },
  ]
  if (isAdmin) {
    tabs.push({ key: 'templates', label: 'Quản lý Template' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center">
          <FileSpreadsheet className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Excel Generator</h1>
          <p className="text-sm text-neutral-500">Tạo file Excel từ template và dữ liệu</p>
        </div>
      </div>

      <div className="border-b border-neutral-200">
        <nav className="flex gap-1 -mb-px">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'generate' && <GeneratePanel templates={templates} />}

      {activeTab === 'history' && (
        <GenerationHistory
          logs={logs}
          templates={templates}
          loading={loadingLogs}
          onChange={fetchLogs}
          isAdmin={isAdmin}
        />
      )}

      {activeTab === 'templates' && isAdmin && (
        <TemplateManager
          templates={templates}
          loading={loadingTemplates}
          onChange={fetchTemplates}
        />
      )}
    </div>
  )
}
