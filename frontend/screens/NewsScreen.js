import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, RefreshControl, Linking, ActivityIndicator } from 'react-native';
import { styles as s } from '../theme';
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
  return <ScrollView contentContainerStyle={s.page} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => setRetry(n => n + 1)} tintColor="#FF655B" />}>
    <Text style={s.label}>북한이 · NEWS BRIEFING</Text><Text style={s.title}>북한 소식</Text><Text style={s.subtitle}>최신 보도를 짧고 명확하게 확인하세요.</Text>
    <Text style={s.caption}>AI가 기사 제목과 검색 설명을 2~3문장으로 요약합니다. 자세한 내용은 원문을 확인하세요.</Text>
    {loading && <ActivityIndicator color="#FF655B" />}
    {!!error && <View style={s.card}><Text style={s.subtitle}>{error}</Text></View>}
    {data.stale && data.updatedAt && <Text style={s.caption}>업데이트가 지연되어 이전 뉴스를 표시합니다.</Text>}
    {data.updatedAt && <Text style={s.caption}>최근 갱신 {new Date(data.updatedAt).toLocaleString('ko-KR')}</Text>}
    <Pressable accessibilityRole="button" disabled={loading} onPress={() => setRetry(n => n + 1)} style={s.chip}><Text style={s.label}>새로고침</Text></Pressable>
    {!loading && !error && !data.articles.length && <Text style={s.subtitle}>등록된 뉴스가 없습니다.</Text>}
    {data.articles.map(article => <View key={article.id} style={s.card}>
      <Text style={s.label}>AI 요약 · 북한</Text><Text style={s.heading}>{article.title}</Text>
      {article.summaryLines.map((line, i) => <Text key={i} style={s.subtitle}>{line}</Text>)}
      <Text style={s.caption}>출처 · {article.source} / {new Date(article.publishedAt).toLocaleDateString('ko-KR')}</Text>
      <Pressable accessibilityRole="link" accessibilityLabel={`${article.source} 기사 원문 보기`} onPress={() => openArticle(article.originalUrl)}><Text style={s.label}>원문 보기 ↗</Text><Text style={s.caption}>{article.originalUrl}</Text></Pressable>
    </View>)}
  </ScrollView>;
}
