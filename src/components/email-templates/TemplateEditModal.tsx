import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Modal from '../Modal'
import HtmlEditor from '../HtmlEditor'
import type { Template } from '../../hooks/queries/useEmailTemplates'
import { emailTemplateSchema, type EmailTemplateFormData } from '../../lib/form-schemas'
import FormField from '../FormField'
import TextInput from '../../ui/input/TextInput'

const defaultPlaceholders = [
  '{{agentName}}', '{{staffId}}', '{{oldT1Name}}', '{{oldT1Email}}', '{{oldT1StaffId}}',
  '{{newT1Name}}', '{{newT1Email}}', '{{newT1StaffId}}', '{{date}}', '{{deadlineDate}}', '{{notifyDate}}', '{{tempT1Name}}', '{{tempT1StaffId}}', '{{b3Deadline}}',
]

const previewData: Record<string, string> = {
  '{{agentName}}': 'Nguyễn Văn A', '{{staffId}}': 'ERA001',
  '{{oldT1Name}}': 'Trần Văn B', '{{oldT1Email}}': 'tvb@era.com', '{{oldT1StaffId}}': 'TV12345',
  '{{newT1Name}}': 'Lê Thị D', '{{newT1Email}}': 'ltd@era.com', '{{newT1StaffId}}': 'TV22904',
  '{{date}}': '25/05/2026', '{{deadlineDate}}': '24/06/2026', '{{notifyDate}}': '25/05/2026',
  '{{tempT1Name}}': 'Nguyễn Văn E', '{{tempT1StaffId}}': 'TV99999',
  '{{b3Deadline}}': '28/05/2026',
}

function slugify(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

interface Props {
  mode: 'edit' | 'create'
  template?: Template | null
  onSave: (payload: { id?: string; name: string; template_key: string; subject: string; body: string }) => void
  onClose: () => void
  saving: boolean
}

export default function TemplateEditModal({ mode, template, onSave, onClose, saving }: Props) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EmailTemplateFormData>({
    resolver: zodResolver(emailTemplateSchema),
    defaultValues: { name: '', template_key: '', subject: '', body: '' },
  })

  const nameValue = watch('name')
  const keyValue = watch('template_key')

  useEffect(() => {
    if (mode === 'edit' && template) {
      reset({
        name: template.name,
        template_key: template.template_key,
        subject: template.subject,
        body: template.body,
      })
    } else {
      reset({ name: '', template_key: '', subject: '', body: '' })
    }
  }, [mode, template, reset])

  useEffect(() => {
    if (mode === 'create' && nameValue && !keyValue) {
      setValue('template_key', slugify(nameValue))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameValue])

  const onSubmit = (data: EmailTemplateFormData) => {
    onSave({ id: template?.id, ...data })
  }

  return (
    <Modal onClose={onClose} title={mode === 'edit' ? 'Chỉnh sửa mẫu email' : 'Thêm mẫu email'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Tên mẫu" error={errors.name?.message} required>
            <TextInput
              {...register('name')}
              placeholder="Ví dụ: Thông báo T1 tạm thờii"
              error={errors.name?.message}
            />
          </FormField>
          <FormField label="Template key" error={errors.template_key?.message} required>
            <TextInput
              {...register('template_key')}
              disabled={mode === 'edit'}
              placeholder="Ví dụ: temp-t1-assigned"
              error={errors.template_key?.message}
              className={mode === 'edit' ? 'bg-bg-secondary text-text-tertiary' : ''}
            />
          </FormField>
        </div>
        <FormField label="Tiêu đề" error={errors.subject?.message} required>
          <TextInput
            {...register('subject')}
            placeholder="[Thông báo] ..."
            error={errors.subject?.message}
          />
        </FormField>
        <FormField label="Nội dung" error={errors.body?.message} required>
          <Controller
            name="body"
            control={control}
            render={({ field }) => (
              <HtmlEditor
                value={field.value}
                onChange={field.onChange}
                placeholders={defaultPlaceholders}
                previewData={previewData}
                height="280px"
              />
            )}
          />
        </FormField>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 h-9 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover transition-colors disabled:opacity-60"
          >
            {saving ? 'Đang lưu...' : mode === 'edit' ? 'Lưu mẫu' : 'Tạo mẫu'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
