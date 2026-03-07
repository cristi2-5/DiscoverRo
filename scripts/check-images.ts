import pkg from '@next/env'
const { loadEnvConfig } = pkg
loadEnvConfig(process.cwd())

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data } = await supabase.from('locations').select('id, title, images_urls').limit(10)
  console.log(data?.map(d => d.images_urls))
}

test()
