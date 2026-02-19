import { useEffect, useMemo, useState } from 'react'

import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'

import { AuthContext, type AuthState } from './authContext'
import { resolveRole, type AuthRole } from './role'
import { supabase } from './supabase'

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<AuthRole | null>(null)

  useEffect(() => {
    let isMounted = true

    const boot = async () => {
      setIsLoading(true)
      try {
        const {
          data: { session: s },
        } = await supabase.auth.getSession()

        if (!isMounted) return

        setSession(s)
        setUser(s?.user ?? null)

        if (!s) {
          setRole(null)
          return
        }

        const r = await resolveRole()
        if (!isMounted) return
        setRole(r)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    boot()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, nextSession: Session | null) => {
        setSession(nextSession)
        setUser(nextSession?.user ?? null)
        setIsLoading(true)
        resolveRole()
          .then((r) => setRole(r))
          .finally(() => setIsLoading(false))
      },
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      isLoading,
      session,
      user,
      role,
    }),
    [isLoading, session, user, role],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
