import LaunchScreen from './screens/LaunchScreen';
import MissileAlerts from './components/MissileAlerts';
import React, { useState } from 'react';
import { View, Pressable, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { Text } from './components/Typography';
import { useFonts } from 'expo-font';
import { NotoSansKR_400Regular } from '@expo-google-fonts/noto-sans-kr/400Regular';
import { NotoSansKR_600SemiBold } from '@expo-google-fonts/noto-sans-kr/600SemiBold';
import { NotoSansKR_700Bold } from '@expo-google-fonts/noto-sans-kr/700Bold';
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
  const [showLaunch, setShowLaunch] = useState(true);
  const [currentTab, setCurrentTab] = useState('news');
  const [fontsLoaded, fontError] = useFonts({ ...Ionicons.font, Gungsuh: require('./assets/Gungsuh.ttf'), NotoSansKR_400Regular, NotoSansKR_600SemiBold, NotoSansKR_700Bold });
  if (!fontsLoaded && !fontError) return <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator color={colors.accent} /></View>;
  return <SafeAreaProvider><View style={s.root}><SafeAreaView style={[s.root, showLaunch && { opacity: 0 }]} pointerEvents={showLaunch ? 'none' : 'auto'} accessibilityElementsHidden={showLaunch} importantForAccessibility={showLaunch ? 'no-hide-descendants' : 'auto'}>
    <StatusBar barStyle="light-content" />
    <View style={s.header}><View><Text style={s.brand}>북한이</Text><Text style={s.caption}>북한 소식을 한눈에</Text></View>
      <MissileAlerts /></View>
    <View style={{ flex: 1 }}>{tabs.map(({ id, screen: Screen }) => <View key={id} style={{ flex: 1, display: currentTab === id ? 'flex' : 'none' }}><Screen /></View>)}</View>
    <View style={s.tabs}>{tabs.map(tab => <Pressable key={tab.id} accessibilityRole="tab" accessibilityState={{ selected: currentTab === tab.id }} accessibilityLabel={tab.label} onPress={() => setCurrentTab(tab.id)} style={s.tab}>
      <Ionicons name={tab.icon} size={23} color={currentTab === tab.id ? colors.accent : colors.muted} /><Text style={[s.tabLabel, { color: currentTab === tab.id ? colors.accent : colors.muted }]}>{tab.label}</Text>
    </Pressable>)}</View>
  </SafeAreaView>
    {showLaunch && <LaunchScreen onFinish={() => setShowLaunch(false)} />}
  </View></SafeAreaProvider>;
}

