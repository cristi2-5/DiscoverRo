import pkg from '@next/env'
const { loadEnvConfig } = pkg
loadEnvConfig(process.cwd())

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function check() {
  const { data, error } = await supabase.rpc('execute_sql', { sql: "SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'locations_category_check';" })
  
  if (error) {
     const { data: d2, error: e2 } = await supabase.from('locations').select('category').limit(20)
     console.log('Cant run RPC. Sample categories:', d2?.map(d=>d.category))
  } else {
     console.log(data)
  }
}
check()
