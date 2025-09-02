// Test Supabase Connection
// Run this with: node test-connection.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n');
  
  // Check environment variables
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.log('❌ Environment variables missing!');
    console.log('Please create a .env file with:');
    console.log('VITE_SUPABASE_URL=your_supabase_url');
    console.log('VITE_SUPABASE_ANON_KEY=your_anon_key');
    return;
  }
  
  console.log('✅ Environment variables found');
  console.log('URL:', url);
  console.log('Key:', key.substring(0, 20) + '...\n');
  
  try {
    // Create Supabase client
    const supabase = createClient(url, key);
    console.log('🔌 Supabase client created');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('employees')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Database connection failed:', error.message);
      return;
    }
    
    console.log('✅ Database connection successful!');
    console.log('✅ Tables are accessible');
    
    // Test specific tables
    const tables = [
      'employees',
      'assessments', 
      'assessment_questions',
      'employee_onboarding'
    ];
    
    for (const table of tables) {
      try {
        const { error: tableError } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (tableError) {
          console.log(`❌ Table '${table}' not accessible:`, tableError.message);
        } else {
          console.log(`✅ Table '${table}' accessible`);
        }
      } catch (e) {
        console.log(`❌ Table '${table}' error:`, e.message);
      }
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
  }
}

// Run the test
testConnection();
