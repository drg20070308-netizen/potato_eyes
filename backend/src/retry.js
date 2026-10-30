// Retry only temporary server failures. Authentication and quota errors require action.
export async function requestWithRetry(url, options, fetcher = fetch, wait = ms => new Promise(resolve => setTimeout(resolve, ms))) {
  for (let attempt = 0; ; attempt++) {
    const response = await fetcher(url, { ...options, signal: AbortSignal.timeout(30000) });
    if (![500, 502, 503, 504].includes(response.status) || attempt >= 2) return response;
    await response.body?.cancel?.();
    await wait(1000 * 2 ** attempt);
  }
}
