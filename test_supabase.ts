import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nhoexyhmqjczvoexabjq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ob2V4eWhtcWpjenZvZXhhYmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTUzNTgsImV4cCI6MjA5NDE3MTM1OH0.C_7cwiz0Id99bdvT5uvdyYJLk69S1M_yLL6h8ygW1cA'
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase.from('auctions').select('*').limit(1)
  if (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
  console.log('Success! Data:', data)
}

test()
