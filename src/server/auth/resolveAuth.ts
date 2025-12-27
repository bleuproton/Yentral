export async function resolveAuthFromRequest(req: Request): Promise<{ userId?: string }> {
  let userId: string | undefined;
  try {
    const { getServerSession } = await import('next-auth');
    const { authOptions } = await import('@/lib/auth');
    const session = await getServerSession(authOptions as any);
    userId = (session as any)?.user?.id ?? undefined;
  } catch {
    // NextAuth not available or failed; fall back to header
    userId = req.headers.get('x-user-id') ?? undefined;
  }
  return userId ? { userId } : {};
}
