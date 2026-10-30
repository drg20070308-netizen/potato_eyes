import React, { useState } from 'react';
import { ScrollView, Text, Pressable } from 'react-native';
import { styles as s } from '../theme';
const items = [
  ['앱 소개', '북한이는 안전 뉴스, 활동 기록, 대피소 정보를 한곳에서 확인하기 위한 앱입니다. 현재는 화면 미리보기 버전입니다.'],
  ['비상용품 준비', '식수, 손전등, 보조 배터리 등 필요한 물품을 준비하고 정기적으로 상태를 확인하세요.'],
  ['대피 전 확인', '가족과 연락 방법을 정하고, 실제 상황에서는 관계 기관의 최신 안내에 따라 이동하세요.'],
  ['데이터 안내', '뉴스는 네이버 검색 자료를 바탕으로 AI가 요약합니다. 점수, 지도, 알림은 예시이며 위치 수집은 수행하지 않습니다.'],
];
export default function InfoScreen() {
  const [open, setOpen] = useState(0);
  return <ScrollView contentContainerStyle={s.page}><Text style={s.label}>ESSENTIAL GUIDE</Text><Text style={s.title}>기본 정보</Text><Text style={s.subtitle}>알아두면 도움이 되는 안전 가이드</Text>
    {items.map(([title, body], i) => <Pressable key={title} accessibilityRole="button" accessibilityState={{ expanded: open === i }} onPress={() => setOpen(open === i ? null : i)} style={s.card}><Text style={s.heading}>{title} {open === i ? '−' : '+'}</Text>{open === i && <Text style={s.subtitle}>{body}</Text>}</Pressable>)}<Text style={[s.caption, { textAlign: 'center' }]}>북한이 · VERSION 1.0.0</Text>
  </ScrollView>;
}

