import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to login or home based on auth status
  // For now, redirect to login
  redirect('/login');
}
