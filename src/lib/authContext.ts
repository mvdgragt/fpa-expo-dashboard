import { createContext } from 'react'

import type { Session, User } from '@supabase/supabase-js'

import type { AuthRole } from './role'

export type AuthState = {
  isLoading: boolean
  session: Session | null
  user: User | null
  role: AuthRole | null
}

export const AuthContext = createContext<AuthState>({
  isLoading: true,
  session: null,
  user: null,
  role: null,
})
