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
