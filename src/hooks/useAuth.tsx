import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { UserProfile } from '../types'

interface AuthState {
  user: UserProfile | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  updatePassword: (newPassword: string) => Promise<{ error?: string }>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !data) {
      console.warn('No user_profile found, creating default...')
      // Try to create a default profile
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({ id: userId, role: 'operator', must_change_password: false })
        .select()
        .single()

      if (createError) {
        console.error('Failed to create profile:', createError)
        return null
      }
      return newProfile as UserProfile
    }
    return data as UserProfile
  }, [])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setSession(session)
      if (session?.user) {
        fetchProfile(session.user.id).then((profile) => {
          if (mounted) {
            setUser(profile)
            setIsLoading(false)
          }
        })
      } else {
        setIsLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Only react to meaningful auth events to avoid excessive re-fetches
      if (!['SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
        return
      }
      setSession(session)
      if (session?.user) {
        fetchProfile(session.user.id).then(setUser)
      } else {
        setUser(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    if (data.user) {
      const profile = await fetchProfile(data.user.id)
      setUser(profile)
      setSession(data.session)
    }
    return {}
  }, [fetchProfile])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }, [])

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { error: error.message }
    if (user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ must_change_password: false })
        .eq('id', user.id)
        .select()
        .single()
      if (profileError) {
        console.error('Failed to update must_change_password flag:', profileError)
        return { error: 'Đổi mật khẩu thành công nhưng không thể cập nhật trạng thái. Vui lòng liên hệ admin.' }
      }
      setUser({ ...user, must_change_password: false })
    }
    return {}
  }, [user])

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signOut,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
