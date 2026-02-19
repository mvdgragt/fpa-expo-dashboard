import { supabase } from '../supabase'

export const getMyClubId = async () => {
  const { data, error } = await supabase
    .from('club_staff')
    .select('club_id')
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data?.club_id ? String(data.club_id) : ''
}
