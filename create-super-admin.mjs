import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ocifxtowxmumcktyalqa.supabase.co'

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const password = process.env.SUPER_ADMIN_PASSWORD

if (!serviceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing')
}

if (!password) {
  throw new Error('SUPER_ADMIN_PASSWORD is missing')
}

const supabase = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// 1. Create Supabase Auth user
const { data: authData, error: authError } =
  await supabase.auth.admin.createUser({
    email: 'abu.bakar041295@gmail.com',
    password,
    email_confirm: true
  })

if (authError) {
  console.error('Auth user creation failed:')
  console.error(authError)
  process.exit(1)
}

const userId = authData.user.id

console.log('Auth user created:', userId)

// 2. Create application profile as Super Admin
const { error: profileError } = await supabase
  .from('profiles')
  .insert({
    id: userId,
    name: 'Abu Bakar',
    email: 'abu.bakar041295@gmail.com',
    role: 'super_admin',
    department: 'Administration'
  })

if (profileError) {
  console.error('Profile creation failed:')
  console.error(profileError)
  process.exit(1)
}

console.log('')
console.log('SUPER ADMIN CREATED SUCCESSFULLY')
console.log('Email: abu.bakar041295@gmail.com')
console.log('Role: super_admin')
console.log('User ID:', userId)