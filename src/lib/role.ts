import { supabase } from './supabase'

export type AuthRole = 'admin' | 'staff'

export const resolveRole = async (): Promise<AuthRole | null> => {
  try {
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin_user')
    if (adminError) throw adminError
    if (isAdmin) return 'admin'
  } catch {
    // ignore
  }

  try {
    const { data, error } = await supabase
      .from('club_staff')
      .select('club_id')
      .limit(1)
      .maybeSingle()

    if (error) throw error
    if (data?.club_id) return 'staff'
    return null
  } catch {
    return null
  }
}
