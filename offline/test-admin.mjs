// Test-only verifier. Never included in the portable package.
export async function verifyTestAdmin(password) {
  if (password !== 'StrongPass123') throw new Error('The password did not match the online Super Admin account.');
  return { email: 'abu.bakar041295@gmail.com', name: 'Abu Bakar', department: 'Administration', role: 'super_admin', status: 'active' };
}
