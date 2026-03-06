import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '' // using service roll to test RLS bypass, wait - if I use service role, it bypasses RLS. To test RLS, I need an anon key and a user session, but I can't easily get a user session in a node script without logging in.
// Alternatively, I can just check the RLS policies in the console or by querying pg_policies.

const supabase = createClient(supabaseUrl, supabaseKey)

async function testPolicies() {
  const { data, error } = await supabase.from('planner_items').select('*').limit(1)
  console.log('Query:', data, error)
}
testPolicies()
