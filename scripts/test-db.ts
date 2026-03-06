import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const categoriesToTest = [
    'restaurant',
    'cafenea',
    'cazare',
    'atractie turistica', 'atractie',
    'natura',
    'muzeu',
    'parc',
    'cumparaturi',
    'altele', 'altul'
  ]

  console.log('Testing categories...')
  for (const cat of categoriesToTest) {
    const payload = {
      title: 'Test Location Check',
      category: cat,
      location_point: 'POINT(24.9668 45.9432)',
      is_published: false
    }
    
    const { data, error } = await supabase.from('locations').insert(payload).select().single()
    if (error) {
      console.log(`❌ Category "${cat}" failed:`, error.message)
    } else {
      console.log(`✅ Category "${cat}" succeeded!`)
      await supabase.from('locations').delete().eq('id', data.id)
    }
  }
}

run()
