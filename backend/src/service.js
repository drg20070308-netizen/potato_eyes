import { safeFailure } from './diagnostics.js';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { collect, summarize, fingerprint } from './news.js';
export function createNewsService({ env, file, fetcher = fetch }) {
  let snapshot = { articles: [], updatedAt: null }, running = null, lastAttempt = 0, failed = false;
  const interval = Math.max(1, Number(env.REFRESH_MINUTES) || 10) * 60000;
  const configured = () => ['NAVER_CLIENT_ID', 'NAVER_CLIENT_SECRET', 'OPENAI_API_KEY'].every(k => !!env[k]);
  async function load() { try { const saved = JSON.parse(await readFile(file, 'utf8')); if (Array.isArray(saved.articles) && saved.updatedAt) snapshot = saved; } catch { /* First run or invalid cache: fetch again. */ } }
  async function refresh() {
    if (running) return running;
    if (!configured() || Date.now() - lastAttempt < interval) return;
    lastAttempt = Date.now();
    running = (async () => {
      try {
        const items = await collect(env, fetcher), articles = [];
        const old = new Map(snapshot.articles.map(a => [a.id, a]));
        // Sequential bounded batch prevents bursts and duplicate AI charges across app requests.
        for (const item of items) {
          const hash = fingerprint(item, env.OPENAI_MODEL || 'gpt-4o-mini');
          const previous = old.get(item.id);
          if (previous?.fingerprint === hash) { articles.push({ ...previous, ...item }); continue; }
          try { articles.push({ ...item, summaryLines: await summarize(item, env, fetcher), summaryBasis: 'title_and_search_description', fingerprint: hash }); }
          catch (error) { failed = true; console.error('News summary failed', JSON.stringify({ ...safeFailure(error), provider: 'openai' })); if ([400, 401, 403, 404, 429].includes(error.status)) throw error; }
        }
        if (items.length && !articles.length) throw new Error('NO_SUMMARIES');
        const next = { articles, updatedAt: new Date().toISOString() };
        await mkdir(new URL('../', file), { recursive: true });
        await writeFile(new URL(`${file.href}.tmp`), JSON.stringify(next), { mode: 0o600 });
        await rename(new URL(`${file.href}.tmp`), file);
        snapshot = next; failed = articles.length < items.length;
      } catch (error) { failed = true; console.error('News refresh failed; retained previous snapshot.', JSON.stringify(safeFailure(error))); }
    })().finally(() => { running = null; });
    return running;
  }
  function read() {
    return { articles: snapshot.articles.map(({ fingerprint, description, ...article }) => article), updatedAt: snapshot.updatedAt, stale: failed || !snapshot.updatedAt || Date.now() - Date.parse(snapshot.updatedAt) > interval * 2, status: !configured() ? 'not_configured' : !snapshot.updatedAt ? (running ? 'warming_up' : 'unavailable') : failed ? 'degraded' : 'ready' };
  }
  return { load, refresh, read, interval };
}
