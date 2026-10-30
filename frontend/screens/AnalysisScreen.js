import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { colors, styles as s } from '../theme';
export default function AnalysisScreen() {
  return <ScrollView contentContainerStyle={s.page}><Text style={s.label}>ACTIVITY INSIGHT</Text><Text style={s.title}>행동 분석</Text><Text style={s.subtitle}>나의 일상을 이해하는 작은 기록</Text><Text style={s.caption}>예시 데이터 · 실제 행동 분석은 연결 전입니다.</Text>
    <View style={[s.card, { alignItems: 'center' }]}><Text style={s.heading}>오늘의 활동 점수</Text><View style={{ width: 150, height: 150, borderRadius: 75, borderWidth: 9, borderColor: colors.accent, borderLeftColor: '#47201D', alignItems: 'center', justifyContent: 'center', marginVertical: 12 }}><Text style={[s.title, { fontSize: 44 }]}>78</Text><Text style={s.subtitle}>/ 100</Text></View><Text style={s.subtitle}>규칙적인 하루를 보내고 있어요</Text></View>
    <View style={s.card}><Text style={s.heading}>최근 7일 활동</Text><View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end', height: 150 }}>{[45, 68, 52, 90, 65, 83, 78].map((value, i) => <View key={i} style={{ flex: 1, alignItems: 'center', gap: 8 }}><Text style={s.caption}>{value}</Text><View style={{ height: value, width: '100%', borderRadius: 6, backgroundColor: i === 6 ? colors.accent : '#72302B' }} /><Text style={s.caption}>{['월', '화', '수', '목', '금', '토', '일'][i]}</Text></View>)}</View></View>
    <View style={s.card}><Text style={s.label}>TODAY’S NOTE</Text><Text style={s.subtitle}>잠깐의 휴식과 가벼운 움직임으로 하루의 균형을 맞춰보세요.</Text></View>
  </ScrollView>;
}
