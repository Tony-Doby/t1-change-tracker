import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function ChangePasswordPage() {
  const { user, updatePassword, signOut } = useAuth()
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!user) {
    navigate('/login', { replace: true })
    return null
  }

  if (!user.must_change_password) {
    navigate('/', { replace: true })
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }

    setLoading(true)
    const result = await updatePassword(newPassword)
    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-primary-hover">
      <div className="w-full max-w-[400px] bg-white rounded-xl p-8 shadow-modal">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Đổi mật khẩu lần đầu</h1>
          <p className="text-sm text-neutral-500 mt-1">Vui lòng đổi mật khẩu để bảo mật tài khoản</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-neutral-700 mb-1">Mật khẩu mới</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full h-10 px-3 border border-neutral-300 rounded-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-neutral-700 mb-1">Xác nhận mật khẩu</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-10 px-3 border border-neutral-300 rounded-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light text-sm"
              required
            />
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
            {loading ? 'Đang xử lý...' : 'Xác nhận'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button onClick={() => signOut()} className="text-xs text-neutral-500 hover:text-neutral-700">
            Đăng xuất
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
