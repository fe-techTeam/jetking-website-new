export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  // Not awaited: `register` must finish before the server accepts requests.
  void import('@/features/knowledge/lib/embeddings')
    .then(({ warmRetrieval }) => warmRetrieval())
    .catch((error: unknown) => {
      console.warn(
        `[retrieval] warm-up failed, first question will load on demand: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    });
}

/** Server-side render, route-handler and action errors: logged (and optionally webhooked) once per signature. */
export const onRequestError: import('next').Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { reportError } = await import('@/lib/error-report');
  const e = error instanceof Error ? error : new Error(String(error));
  await reportError(
    'server',
    { message: e.message, stack: e.stack, digest: (error as { digest?: string } | null)?.digest },
    { path: request.path, method: request.method, route: context.routePath, routeType: context.routeType },
  );
};
