import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, Linking, AppState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, styles as s } from '../theme';
const base = process.env.EXPO_PUBLIC_API_URL || 'https://potato-eyes.onrender.com';
export default function MissileAlerts() {
  const [alerts, setAlerts] = useState([]), [visible, setVisible] = useState(false), [error, setError] = useState(''), [stale, setStale] = useState(false);
  useEffect(() => {
    let active = true, busy = false; const controllers = new Set();
    async function check() {
      if (busy) return; busy = true;
      const controller = new AbortController(); controllers.add(controller); const timeout = setTimeout(() => controller.abort(), 90000);
      try { const response = await fetch(`${base.replace(/\/$/, '')}/api/alerts`, { signal: controller.signal }); if (!response.ok) throw Error(); const data = await response.json(); if (!Array.isArray(data.alerts)) throw Error(); if (active) { setAlerts(data.alerts); setStale(data.stale); setError(''); } }
      catch { if (active) setError('알림 정보를 가져오지 못했습니다.'); }
      finally { clearTimeout(timeout); controllers.delete(controller); busy = false; }
    }
    check(); const timer = setInterval(check, 60000); const listener = AppState.addEventListener('change', state => { if (state === 'active') check(); });
    return () => { active = false; clearInterval(timer); listener.remove(); controllers.forEach(c => c.abort()); };
  }, []);
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel={`미사일 보도 알림 ${alerts.length}개`} style={s.notification} onPress={() => setVisible(true)}><Ionicons name="notifications-outline" size={24} color={colors.text} />{alerts.length > 0 && <View style={s.badge}><Text style={s.badgeText}>{alerts.length}</Text></View>}</Pressable>
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setVisible(false)}><View style={s.root}><ScrollView contentContainerStyle={s.page}><View style={s.row}><Text style={s.heading}>미사일 보도 알림</Text><Pressable accessibilityRole="button" onPress={() => setVisible(false)}><Text style={s.label}>닫기</Text></Pressable></View><Text style={s.caption}>뉴스 검색 설명 기반 · 공식 재난 경보가 아닙니다. 앱 실행 중 확인하며, 잠금 화면 푸시는 아직 연결 전입니다.</Text>{!!error && <Text style={s.subtitle}>{error}</Text>}{stale && <Text style={s.caption}>갱신이 지연되고 있습니다.</Text>}{!alerts.length && <Text style={s.subtitle}>최근 확인된 미사일 보도가 없습니다.</Text>}{alerts.map(a => <View key={a.id} style={s.card}><Text style={s.heading}>{a.line}</Text><Text style={s.caption}>{a.source} · {new Date(a.publishedAt).toLocaleString('ko-KR')}</Text><Pressable accessibilityRole="link" onPress={() => { if (/^https?:\/\//.test(a.originalUrl)) Linking.openURL(a.originalUrl).catch(() => setError('원문을 열지 못했습니다.')); }}><Text style={s.label}>기사 원문 확인 ↗</Text></Pressable></View>)}</ScrollView></View></Modal>
  </>;
}
