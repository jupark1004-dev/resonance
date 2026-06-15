const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split(/\r?\n/).reduce((acc, line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) acc[match[1]] = match[2].trim().replace(/^"|"$/g, '');
  return acc;
}, {});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function reset() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error(error);
    return;
  }
  const user = users.find(u => u.email === 'chb2049@naver.com');
  if (user) {
    const res = await supabase.auth.admin.updateUserById(user.id, { password: 'password123!' });
    if (res.error) console.error(res.error);
    else console.log('Password reset to: password123!');
  } else {
    console.log('User not found');
  }
}
reset();
