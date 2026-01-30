require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

// Test Supabase connection
async function testSupabaseUpload() {
  console.log('=== Testing Supabase Upload ===');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
  console.log('URL length:', process.env.SUPABASE_URL?.length);
  console.log('URL has newline:', process.env.SUPABASE_URL?.includes('\n'));
  console.log('SUPABASE_ANON_KEY length:', process.env.SUPABASE_ANON_KEY?.length);
  console.log('Key has newline:', process.env.SUPABASE_ANON_KEY?.includes('\n'));

  // Clean the values (remove newlines)
  const cleanUrl = process.env.SUPABASE_URL?.trim();
  const cleanKey = process.env.SUPABASE_ANON_KEY?.trim();

  console.log('\nCleaned URL:', cleanUrl);
  console.log('Cleaned URL length:', cleanUrl?.length);

  const supabase = createClient(cleanUrl, cleanKey);

  // Create a test file
  const testContent = Buffer.from('This is a test file for Supabase upload');
  const testFileName = `test_${Date.now()}.txt`;

  console.log('\nUploading test file:', testFileName);

  const { data, error } = await supabase.storage
    .from('ASSESSMENT-FILES')
    .upload(testFileName, testContent, {
      contentType: 'text/plain',
      upsert: false
    });

  if (error) {
    console.error('Upload failed:', error);
    return false;
  }

  console.log('Upload successful!');
  console.log('Data:', data);

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('ASSESSMENT-FILES')
    .getPublicUrl(testFileName);

  console.log('Public URL:', publicUrlData.publicUrl);

  // Clean up test file
  const { error: deleteError } = await supabase.storage
    .from('ASSESSMENT-FILES')
    .remove([testFileName]);

  if (deleteError) {
    console.error('Failed to delete test file:', deleteError);
  } else {
    console.log('Test file deleted successfully');
  }

  return true;
}

testSupabaseUpload()
  .then(success => {
    console.log('\n=== Test Result ===');
    console.log(success ? '✅ SUCCESS' : '❌ FAILED');
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Test error:', err);
    process.exit(1);
  });
