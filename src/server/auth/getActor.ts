import { getServerAuthSession } from '@/lib/auth';
import { AuthRequiredError } from '../http/errors';

export async function getActorUserId(): Promise<string> {
  const session = await getServerAuthSession();
  const userId = session?.user?.id as string | undefined;
  if (!userId) {
    throw new AuthRequiredError();
  }
  return userId;
}
