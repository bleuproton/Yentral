import { redirect } from 'next/navigation';
import { getServerAuthSession } from '@/lib/auth';

export default async function Home() {
  const session = await getServerAuthSession().catch(() => null);
  if (session?.user?.id) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
