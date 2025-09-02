
// testSupabase.ts
import { supabase } from './supabaseClient'

async function testConnection() {
  // Example: list all rows from a table called 'users'
  const { data, error } = await supabase.from('users').select('*')
  
  if (error) {
    console.error('Supabase error:', error)
  } else {
    console.log('Data from Supabase:', data)
  }
}

testConnection()