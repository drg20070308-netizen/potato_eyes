export function safeFailure(error) {
  const known = new Set(['NO_SUMMARIES', 'INVALID_NAVER_RESPONSE', 'INCOMPLETE_SUMMARY', 'INVALID_SUMMARY']);
  return {
    provider: ['naver', 'gemini'].includes(error?.provider) ? error.provider : 'pipeline',
    code: Number.isInteger(error?.status) ? `HTTP_${error.status}` : error?.name === 'TimeoutError' ? 'TIMEOUT' : known.has(error?.message) ? error.message : 'REQUEST_OR_PROCESSING_FAILED',
    ...(error?.providerCode ? { providerCode: error.providerCode } : {}),
  };
}

