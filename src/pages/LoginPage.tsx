import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const { signIn, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@era.vn')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    if (user?.must_change_password) {
      navigate('/change-password', { replace: true })
    } else {
      navigate('/', { replace: true })
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await signIn(email, password)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-primary-hover">
      <div className="w-full max-w-[400px] bg-white rounded-xl p-8 shadow-modal">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">T1 Change Tracker</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-neutral-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 px-3 border border-neutral-300 rounded-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light text-sm"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-neutral-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 px-3 pr-10 border border-neutral-300 rounded-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light text-sm"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-primary hover:bg-primary-hover text-white rounded-md font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : null}
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={async () => {
              await supabase.auth.resetPasswordForEmail(email)
              alert('Vui lòng kiểm tra email để đặt lại mật khẩu')
            }}
            className="text-xs text-primary hover:underline"
          >
            Quên mật khẩu?
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-danger-light text-danger text-sm rounded-md">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
