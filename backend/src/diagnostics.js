// Provider messages are only written to server logs, never to the public API.
export function redact(value, secrets = []) {
  let text = String(value ?? '');
  for (const secret of secrets.filter(Boolean).sort((a, b) => b.length - a.length)) text = text.split(secret).join('[REDACTED]');
  return text.replace(/AIza[\w-]+/g, '[REDACTED]').replace(/sk-[\w-]+/g, '[REDACTED]').replace(/https?:\/\/\S+/g, '[URL]').replace(/[\r\n\t]/g, ' ').slice(0, 700);
}
export function safeFailure(error) {
  const known = new Set(['NO_SUMMARIES', 'INVALID_NAVER_RESPONSE', 'INCOMPLETE_SUMMARY', 'INVALID_SUMMARY', 'INVALID_MODEL']);
  return {
    provider: ['naver', 'gemini'].includes(error?.provider) ? error.provider : 'pipeline',
    code: ['ENOENT', 'EACCES', 'EPERM', 'ENOSPC', 'EROFS'].includes(error?.code) ? "STORAGE_" : Number.isInteger(error?.status) ? `HTTP_${error.status}` : error?.name === 'TimeoutError' ? 'TIMEOUT' : known.has(error?.message) ? error.message : 'REQUEST_OR_PROCESSING_FAILED',
    ...(error?.providerCode ? { providerCode: error.providerCode } : {}),
    ...(error?.safeMessage ? { message: error.safeMessage } : {}),
    ...(error?.safeReason ? { reason: error.safeReason } : {}),
  };
}
