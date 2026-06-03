import Modal from '../Modal'
import { plainTextToHtml } from '../HtmlEditor'
import type { Template } from '../../hooks/queries/useEmailTemplates'

const previewData: Record<string, string> = {
  '{{agentName}}': 'Nguyễn Văn A', '{{staffId}}': 'ERA001',
  '{{oldT1Name}}': 'Trần Văn B', '{{oldT1Email}}': 'tvb@era.com', '{{oldT1StaffId}}': 'TV12345',
  '{{newT1Name}}': 'Lê Thị D', '{{newT1Email}}': 'ltd@era.com', '{{newT1StaffId}}': 'TV22904',
  '{{date}}': '25/05/2026', '{{deadlineDate}}': '24/06/2026', '{{notifyDate}}': '25/05/2026',
  '{{tempT1Name}}': 'Nguyễn Văn E', '{{tempT1StaffId}}': 'TV99999',
}

function getPreviewHtml(template: Template) {
  let html = plainTextToHtml(template.body)
  Object.entries(previewData).forEach(([k, v]) => {
    html = html.replace(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), v)
  })
  return html
}

export default function TemplatePreviewModal({ template, onClose }: { template: Template; onClose: () => void }) {
  const subject = template.subject.replace(/{{(\w+)}}/g, (m) => previewData[m] ?? m)
  return (
    <Modal onClose={onClose} title="Xem trước mẫu" maxWidth="max-w-2xl">
      <div className="border border-neutral-200 rounded-lg overflow-hidden">
        <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200 text-xs text-neutral-500">Subject: {subject}</div>
        <div className="p-4 text-sm text-neutral-800 prose prose-sm max-w-none bg-white" dangerouslySetInnerHTML={{ __html: getPreviewHtml(template) }} />
      </div>
    </Modal>
  )
}
