import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { collect } from './news.js';
import { safeFailure } from './diagnostics.js';
export function detectMissileReport(article, now = Date.now()) {
  const date = Date.parse(article.publishedAt);
  if (!Number.isFinite(date) || date > now || now - date > 6 * 3600000) return null;
  const text = `${article.title}. ${article.description}`;
  if (!/북한|北/.test(text)) return null;
  const launch = /(?:미사일|탄도탄)[^.!?。]{0,35}(?:발사|쐈|낙하|떨어)|(?:발사한|쏜)[^.!?。]{0,20}(?:미사일|탄도탄)/;
  if (!launch.test(text)) return null;
  if (/무인기|드론|전시회/.test(article.title) && !launch.test(article.title)) return null;
  // Search snippets cannot establish actual impact coordinates; quote a bounded passage only.
  if (/모형|모의|가상|시뮬레이션|발사하지|발사 안|발사설.*부인|오보/.test(text)) return null;
  const sentences = text.split(/(?<=[.!?。])\s+/);
  const passage = sentences.find(s => /낙하|떨어/.test(s) && /동해|서해|남해|한반도|한국|남한|군사분계선|북방한계선|NLL|일본해/.test(s));
  const uncertain = !passage || /추정|가능성|예상|미확인|확인되지|것으로|우려/.test(passage);
  const quote = passage?.trim().slice(0, 140);
  const line = quote ? `보도${uncertain ? '(추정)' : ''}: ${quote}` : '북한 미사일 발사 보도 · 낙하 위치 미확인';
  const id = createHash('sha256').update(article.id).digest('hex').slice(0, 24);
  return { id, line, uncertain, source: article.source, originalUrl: article.originalUrl, publishedAt: article.publishedAt, title: article.title };
}
export function createMissileService({ env, file, fetcher = fetch, now = Date.now }) {
  let alerts = [], updatedAt = null, running = null, attempted = 0, failure = null;
  const interval = Math.max(5, Number(env.MISSILE_POLL_MINUTES) || 10) * 60000;
  async function load() { try { const data = JSON.parse(await readFile(file, 'utf8')); if (Array.isArray(data.alerts)) { alerts = data.version === 2 ? data.alerts : []; updatedAt = data.version === 2 ? data.updatedAt : null; } } catch {} }
  async function refresh() {
    if (running) return running;
    if (!env.NAVER_CLIENT_ID || !env.NAVER_CLIENT_SECRET || (attempted && now() - attempted < interval)) return;
    attempted = now();
    running = (async () => {
      try {
        const articles = await collect(env, fetcher, '북한 미사일');
        const incoming = articles.map(a => detectMissileReport(a, now())).filter(Boolean);
        alerts = [...new Map([...incoming, ...alerts].map(a => [a.id, a])).values()].filter(a => now() - Date.parse(a.publishedAt) < 24 * 3600000).sort((a,b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 30);
        updatedAt = new Date(now()).toISOString();
        await mkdir(new URL('./', file), { recursive: true });
        await writeFile(new URL(`${file.href}.tmp`), JSON.stringify({ version: 2, alerts, updatedAt })); await rename(new URL(`${file.href}.tmp`), file);
        failure = null;
      } catch (error) { failure = safeFailure(error); console.error('Missile report check failed', JSON.stringify(failure)); }
    })().finally(() => { running = null; }); return running;
  }
  return { load, refresh, read: () => ({ alerts, updatedAt, stale: !!failure || !updatedAt || now() - Date.parse(updatedAt) > interval * 2, notice: '뉴스 검색 설명 기반이며 공식 재난 경보가 아닙니다. 실제 위치는 원문과 공식 발표를 확인하세요.' }) };
}
