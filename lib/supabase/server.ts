import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server-side client for API routes with service role key
export const createServerSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey)
}

// Default export for compatibility
export default createServerSupabaseClient
