import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, styles as s } from '../theme';
const shelters = ['중앙 주민센터', '마을 지하 대피소', '시민 공원 대피 공간'];
export default function ShelterScreen() {
  const [selected, setSelected] = useState(0);
  return <ScrollView contentContainerStyle={s.page}><Text style={s.label}>SHELTER FINDER</Text><Text style={s.title}>대피소 지도</Text><Text style={s.subtitle}>주변 대피 공간을 한눈에 살펴보세요.</Text><Text style={s.caption}>가상 지도 · 시설과 위치는 모두 예시입니다.</Text>
    <View style={[s.card, { height: 290, overflow: 'hidden', backgroundColor: '#241311' }]}>
      {[15, 38, 65, 85].map(x => <View key={x} style={{ position: 'absolute', left: `${x}%`, top: 0, bottom: 0, width: 12, backgroundColor: '#38221F', transform: [{ rotate: '20deg' }] }} />)}
      {[25, 60, 85].map(y => <View key={y} style={{ position: 'absolute', top: `${y}%`, left: 0, right: 0, height: 10, backgroundColor: '#38221F' }} />)}
      {shelters.map((name, i) => <Pressable key={name} accessibilityRole="button" accessibilityLabel={name} onPress={() => setSelected(i)} style={{ position: 'absolute', left: `${20 + i * 25}%`, top: `${25 + (i % 2) * 30}%`, padding: 10, borderRadius: 24, backgroundColor: selected === i ? colors.accent : '#62302A' }}><Ionicons name="location" color={colors.text} size={24} /></Pressable>)}
      <Text style={[s.caption, { position: 'absolute', bottom: 12, left: 16 }]}>SAMPLE MAP</Text>
    </View>
    {shelters.map((name, i) => <Pressable key={name} accessibilityRole="button" accessibilityState={{ selected: selected === i }} onPress={() => setSelected(i)} style={[s.card, selected === i && { borderColor: colors.accent }]}><Text style={s.label}>대피 공간 {String(i + 1).padStart(2, '0')}</Text><Text style={s.heading}>{name}</Text><Text style={s.subtitle}>{selected === i ? '지도에서 선택한 시설 · 예시 정보' : '눌러서 지도 위치 보기'}</Text></Pressable>)}
  </ScrollView>;
}
