import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { loginSchema, type LoginFormData } from '../lib/form-schemas'
import Card from '../ui/layout/Card'
import TextInput from '../ui/input/TextInput'

export default function LoginPage() {
  const { signIn, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'admin@era.vn', password: '' },
  })

  if (isAuthenticated) {
    if (user?.must_change_password) {
      navigate('/change-password', { replace: true })
    } else {
      navigate('/', { replace: true })
    }
    return null
  }

  const onSubmit = async (data: LoginFormData) => {
    const result = await signIn(data.email, data.password)
    if (result.error) {
      setError('root', { message: result.error })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-tertiary">
      <Card padding="lg" className="w-full max-w-[400px] shadow-super-heavy">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-md bg-accent flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-[1.85rem] font-semibold text-text-primary tracking-tight">T1 Change Tracker</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <TextInput
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <TextInput
            label="Mật khẩu"
            type="password"
            autoComplete="current-password"
            isPassword
            error={errors.password?.message}
            {...register('password')}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-10 bg-accent hover:bg-accent-hover text-white rounded-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSubmitting && (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={async () => {
              const emailValue = (document.querySelector('input[type="email"]') as HTMLInputElement)?.value
              if (emailValue) {
                await supabase.auth.resetPasswordForEmail(emailValue)
                alert('Vui lòng kiểm tra email để đặt lại mật khẩu')
              }
            }}
            className="text-xs text-accent hover:underline"
          >
            Quên mật khẩu?
          </button>
        </div>

        {errors.root && (
          <div className="mt-4 p-3 bg-danger-subtle text-danger text-sm rounded-sm">
            {errors.root.message}
          </div>
        )}
      </Card>
    </div>
  )
}
