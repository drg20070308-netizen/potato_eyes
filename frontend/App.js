import React, { useState } from 'react';
import { View, Text, Pressable, StatusBar, Alert } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import NewsScreen from './screens/NewsScreen';
import AnalysisScreen from './screens/AnalysisScreen';
import ShelterScreen from './screens/ShelterScreen';
import InfoScreen from './screens/InfoScreen';
import { colors, styles as s } from './theme';

const tabs = [
  { id: 'news', label: '뉴스', icon: 'newspaper-outline', screen: NewsScreen },
  { id: 'analysis', label: '행동 분석', icon: 'analytics-outline', screen: AnalysisScreen },
  { id: 'shelter', label: '대피소 지도', icon: 'map-outline', screen: ShelterScreen },
  { id: 'info', label: '기본 정보', icon: 'information-circle-outline', screen: InfoScreen },
];

export default function App() {
  const [currentTab, setCurrentTab] = useState('news');
  return <SafeAreaProvider><SafeAreaView style={s.root}>
    <StatusBar barStyle="light-content" />
    <View style={s.header}><View><Text style={s.brand}>북한이</Text><Text style={s.caption}>북한 소식을 한눈에</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="알림 2개 확인" style={s.notification} onPress={() => Alert.alert('알림 · 미리보기', '안전 뉴스가 업데이트되었습니다.\n대피 준비 정보를 확인해 보세요.')}>
        <Ionicons name="notifications-outline" size={24} color={colors.text} /><View style={s.badge}><Text style={s.badgeText}>2</Text></View>
      </Pressable></View>
    <View style={{ flex: 1 }}>{tabs.map(({ id, screen: Screen }) => <View key={id} style={{ flex: 1, display: currentTab === id ? 'flex' : 'none' }}><Screen /></View>)}</View>
    <View style={s.tabs}>{tabs.map(tab => <Pressable key={tab.id} accessibilityRole="tab" accessibilityState={{ selected: currentTab === tab.id }} accessibilityLabel={tab.label} onPress={() => setCurrentTab(tab.id)} style={s.tab}>
      <Ionicons name={tab.icon} size={23} color={currentTab === tab.id ? colors.accent : colors.muted} /><Text style={[s.tabLabel, { color: currentTab === tab.id ? colors.accent : colors.muted }]}>{tab.label}</Text>
    </Pressable>)}</View>
  </SafeAreaView></SafeAreaProvider>;
}

