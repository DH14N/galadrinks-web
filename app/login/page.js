import { redirect } from 'next/navigation';

// The old /login route now lives at /trade-login.
// This keeps any saved bookmarks working.
export default function LoginRedirect() {
  redirect('/trade-login');
}
