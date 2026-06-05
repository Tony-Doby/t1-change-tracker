import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
})
export type LoginFormData = z.infer<typeof loginSchema>

export const changePasswordSchema = z
  .object({
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirm: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirm'],
  })
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

export const createRequestSchema = z.object({
  selectedT1Id: z.string().min(1, 'Vui lòng chọn T1 mới'),
})
export type CreateRequestFormData = z.infer<typeof createRequestSchema>

export const rankSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên cấp bậc'),
  rank_type: z.string().optional().nullable(),
  sort_order: z.string().optional().nullable(),
})
export type RankFormData = z.infer<typeof rankSchema>

export const divisionSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên division'),
  head_agent_id: z.string().optional().nullable(),
  is_official: z.boolean().optional(),
})
export type DivisionFormData = z.infer<typeof divisionSchema>

export const emailTemplateSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên mẫu'),
  template_key: z.string().min(1, 'Vui lòng nhập template key'),
  subject: z.string().min(1, 'Vui lòng nhập tiêu đề'),
  body: z.string().min(1, 'Vui lòng nhập nội dung'),
})
export type EmailTemplateFormData = z.infer<typeof emailTemplateSchema>

export const holidaySchema = z.object({
  holiday_date: z.string().min(1, 'Vui lòng chọn ngày'),
  name: z.string().min(1, 'Vui lòng nhập tên ngày lễ'),
  year: z.number().optional(),
})
export type HolidayFormData = z.infer<typeof holidaySchema>

export const agentInfoSchema = z.object({
  full_name: z.string().min(1, 'Vui lòng nhập tên'),
  staff_id: z.string().min(1, 'Vui lòng nhập mã NV'),
  email: z.string().email('Email không hợp lệ').optional().nullable().or(z.literal('')),
  business_email: z.string().email('Email không hợp lệ').optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  rank_id: z.string().optional().nullable(),
  contract_signing_date: z.string().optional().nullable(),
  register_date: z.string().optional().nullable(),
  agent_start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  deactivation_reason: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  id_card_number: z.string().optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  id_card_issue_date: z.string().optional().nullable(),
  id_card_issue_place: z.string().optional().nullable(),
  place_of_origin: z.string().optional().nullable(),
  permanent_address: z.string().optional().nullable(),
  bank_name: z.string().optional().nullable(),
  bank_account_number: z.string().optional().nullable(),
  bank_branch_name: z.string().optional().nullable(),
  tax_code: z.string().optional().nullable(),
  active_area: z.string().optional().nullable(),
  real_estate_experience: z.string().optional().nullable(),
  broker_licence_number: z.string().optional().nullable(),
  broker_licence_expiry_date: z.string().optional().nullable(),
  success_seminar_date: z.string().optional().nullable(),
})
export type AgentInfoFormData = z.infer<typeof agentInfoSchema>
