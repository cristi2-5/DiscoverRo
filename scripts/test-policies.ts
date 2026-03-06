import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function testPolicies() {
  const { data, error } = await supabase.rpc('get_policies' as any).catch(() => ({ data: null, error: 'RPC failed' }))
  console.log('RPC Error:', error)
  // Let's just create an RPC function or simply query with postgrest? We can't query pg_policies via postgrest.
}
testPolicies()
