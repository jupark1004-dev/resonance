import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    console.log('Running SQL...');
    // We cannot run arbitrary SQL via the JS client easily without a stored procedure.
    // Let's just create a dummy user using auth.signUp
    console.log('Dummy user setup instead.');
    
    const timestamp = Date.now();
    const email = `dummy_${timestamp}@resonance.app`;
    
    const { data, error } = await supabase.auth.signUp({
        email,
        password: 'password123'
    });
    
    if (error) {
        console.error('Error signing up dummy user:', error);
        return;
    }
    
    const userId = data.user?.id;
    console.log('Created dummy user:', userId);
    
    if (userId) {
        // Update profile
        const { error: profileError } = await supabase
            .from('users')
            .update({
                nickname: '겨울밤바다',
                birth_year: 1995,
                gender: 'female',
                region: '서울'
            })
            .eq('id', userId);
            
        if (profileError) {
            console.error('Error updating dummy profile:', profileError);
        } else {
            console.log('Dummy profile updated.');
        }
    }
}

run();
