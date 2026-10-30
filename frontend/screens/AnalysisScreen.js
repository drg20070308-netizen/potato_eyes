import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, Linking, ActivityIndicator, RefreshControl } from 'react-native';
import { styles as s } from '../theme';
const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://potato-eyes.onrender.com';
export default function AnalysisScreen() {
  const [data, setData] = useState(null), [loading, setLoading] = useState(false), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); let active = true;
    const timeout = setTimeout(() => controller.abort(), 90000);
    setLoading(true); setError('');
    fetch(`${baseUrl.replace(/\/$/, '')}/api/analysis`, { signal: controller.signal }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw Error(result.failure?.code === 'NO_RECENT_NEWS' ? '최근 24시간 내 분석할 보도가 부족합니다.' : '분석을 준비 중이거나 연결이 지연되고 있습니다. 잠시 후 다시 확인해 주세요.');
      if (!result.analysis || !Array.isArray(result.analysis.sources) || !Array.isArray(result.analysis.research)) throw Error('분석 응답을 확인할 수 없습니다.');
      if (active) setData(result);
    }).catch(e => { if (active) setError(e.name === 'AbortError' ? '연결 시간이 초과되었습니다.' : e.message); }).finally(() => { clearTimeout(timeout); if (active) setLoading(false); });
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [retry]);
  const analysis = data?.analysis;
  const open = url => { if (/^https?:\/\//i.test(url)) Linking.openURL(url).catch(() => setError('출처를 열지 못했습니다.')); };
  return <ScrollView contentContainerStyle={s.page} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => setRetry(n => n + 1)} tintColor="#FF655B" />}>
    <Text style={s.label}>POLITICAL PSYCHOLOGY</Text><Text style={s.title}>행동 분석</Text><Text style={s.subtitle}>김정은의 행동, 그 배경을 읽다</Text>
    <Text style={s.caption}>최근 24시간 보도 기반 · 하루 한 번 갱신 · 개인의 내면에 대한 진단이 아닌 가능한 전략적 동기 분석입니다.</Text>
    {loading && <ActivityIndicator color="#FF655B" />}{!!error && <Text style={s.subtitle}>{error}</Text>}
    <Pressable style={s.chip} accessibilityRole="button" disabled={loading} onPress={() => setRetry(n => n + 1)}><Text style={s.label}>새로고침</Text></Pressable>
    {analysis && <>
      <Text style={s.heading}>{analysis.headline}</Text>
      <Text style={s.caption}>갱신 {new Date(data.updatedAt).toLocaleString('ko-KR')}{data.stale ? ' · 갱신 지연: 이전 분석' : ''}</Text>
      {[['관찰된 행동', analysis.observation], ['왜 이런 행동을 했을까', analysis.motives], ['국제 정세와의 연결', analysis.worldContext], ['다른 해석과 한계', analysis.uncertainty]].map(([title, body]) => <View key={title} style={s.card}><Text style={s.label}>{title}</Text><Text style={s.subtitle}>{body}</Text></View>)}
      {!data.contextAvailable && <Text style={s.caption}>국제 정세 추가 자료를 확보하지 못했습니다.</Text>}
      <View style={s.card}><Text style={s.heading}>분석 근거</Text>{analysis.sources.map(source => <Pressable key={source.id} accessibilityRole="link" onPress={() => open(source.originalUrl)}><Text style={s.subtitle}>{source.title} ↗</Text><Text style={s.caption}>{source.source}</Text></Pressable>)}</View>
      <View style={s.card}><Text style={s.heading}>참고 연구</Text><Text style={s.caption}>정치심리학의 일반 이론을 참고한 AI 해석입니다. 김정은을 직접 연구한 결과는 아닙니다.</Text>{analysis.research.map(paper => <Pressable key={paper.id} accessibilityRole="link" onPress={() => open(paper.url)}><Text style={s.subtitle}>{paper.title} ↗</Text></Pressable>)}</View>
    </>}
  </ScrollView>;
}
