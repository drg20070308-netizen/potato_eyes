import { Text } from '../components/Typography';
import React, { useEffect, useState } from 'react';
import { ScrollView, View, Pressable, RefreshControl, Linking, ActivityIndicator } from 'react-native';
import { colors, styles as s } from '../theme';
const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://potato-eyes.onrender.com';
export default function NewsScreen() {
  const [data, setData] = useState({ articles: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 90000);
    async function load() {
      setLoading(true); setError('');
      try {
        if (!baseUrl) throw new Error('서버 주소 설정이 필요합니다.');
        const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/news`, { signal: controller.signal });
        const result = await response.json();
        if (!response.ok) throw new Error(result.status === 'not_configured' ? '뉴스 서비스 준비 중입니다. 서버 API 키를 설정해 주세요.' : result.status === 'warming_up' ? '첫 뉴스를 요약하고 있습니다. 잠시 후 새로고침해 주세요.' : '뉴스 서비스 연결에 문제가 있습니다. 잠시 후 다시 시도해 주세요.');
        if (!Array.isArray(result.articles) || result.articles.some(a => !a || typeof a.title !== 'string' || !Array.isArray(a.summaryLines) || a.summaryLines.some(line => typeof line !== 'string'))) throw new Error('뉴스 응답을 확인할 수 없습니다.');
        if (active) setData(result);
      } catch (e) { if (active) setError(e.name === 'AbortError' ? '연결 시간이 초과되었습니다. 다시 시도해 주세요.' : e.message); }
      finally { clearTimeout(timeout); if (active) setLoading(false); }
    }
    load(); return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [retry]);
  async function openArticle(url) {
    if (!/^https?:\/\//i.test(url)) return;
    try { await Linking.openURL(url); } catch { setError('원문을 열지 못했습니다. 잠시 후 다시 시도해 주세요.'); }
  }
  return <ScrollView contentContainerStyle={s.page} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => setRetry(n => n + 1)} tintColor={colors.accent} />}>
    <Text style={s.label}>북한이 · NEWS BRIEFING</Text><Text style={s.title}>북한 소식</Text>
    {loading && <ActivityIndicator color={colors.accent} />}
    {!!error && <View style={s.card}><Text variant="default" style={s.cardSubtitle}>{error}</Text></View>}
    {data.stale && data.updatedAt && <Text variant="default" style={s.caption}>업데이트가 지연되어 이전 뉴스를 표시합니다.</Text>}
    {data.updatedAt && <Text variant="default" style={s.caption}>최근 갱신 {new Date(data.updatedAt).toLocaleString('ko-KR')}</Text>}
    <Pressable accessibilityRole="button" disabled={loading} onPress={() => setRetry(n => n + 1)} style={s.chip}><Text style={s.cardLabel}>새로고침</Text></Pressable>
    {!loading && !error && !data.articles.length && <Text style={s.subtitle}>등록된 뉴스가 없습니다.</Text>}
    {data.articles.map(article => <View key={article.id} style={s.card}>
      <Text style={s.cardLabel}>AI 요약 · 북한</Text><Text style={s.cardHeading}>{article.title}</Text>
      {article.summaryLines.map((line, i) => <Text variant="default" key={i} style={s.cardSubtitle}>{line}</Text>)}
      <Text variant="default" style={s.cardCaption}>출처 · {article.source} / {new Date(article.publishedAt).toLocaleDateString('ko-KR')}</Text>
      <Pressable accessibilityRole="link" accessibilityLabel={`${article.source} 기사 원문 보기`} onPress={() => openArticle(article.originalUrl)}><Text style={s.cardLabel}>원문 보기 ↗</Text><Text variant="default" style={s.cardCaption}>{article.originalUrl}</Text></Pressable>
    </View>)}
  </ScrollView>;
}
