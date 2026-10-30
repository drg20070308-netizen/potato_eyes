import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export default function LaunchScreen({ onFinish }) {
  const { height, width } = useWindowDimensions();
  const fall = useRef(new Animated.Value(0)).current;
  const impact = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const done = useRef(false);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;
  const finish = () => { if (!done.current) { done.current = true; finishRef.current(); } };
  useEffect(() => {
    let cancelled = false, animation;
    const fallback = setTimeout(finish, 6000);
    AccessibilityInfo.isReduceMotionEnabled().catch(() => false).then(reduced => {
      if (cancelled) return;
      if (reduced) { finish(); return; }
      animation = Animated.sequence([
        Animated.delay(250),
        Animated.timing(fall, { toValue: 1, duration: 1000, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(impact, { toValue: 1, duration: 1900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.sequence([18, -16, 13, -10, 7, -4, 0].map(value => Animated.timing(shake, { toValue: value, duration: 65, useNativeDriver: true }))),
        ]),
        Animated.delay(400),
        Animated.timing(fade, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]);
      animation.start(({ finished }) => { if (finished && !cancelled) finish(); });
    });
    return () => { cancelled = true; clearTimeout(fallback); animation?.stop(); };
  }, [fall, impact, fade, shake]);
  return <Animated.View style={[StyleSheet.absoluteFillObject, styles.root, { opacity: fade }]} accessibilityViewIsModal>
    <Animated.Image source={require('../assets/kim-jong-un.jpg')} resizeMode="cover" accessibilityIgnoresInvertColors accessible={false} style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%', opacity: impact.interpolate({ inputRange: [0, 0.12, 0.5, 1], outputRange: [0.12, 0.45, 0.32, 0.18] }), transform: [{ scale: impact.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }] }]} />
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(50, 0, 0, 0.5)' }]} />
    <View style={styles.top}><Text style={styles.eyebrow}>NORTH KOREA · DAILY INTELLIGENCE</Text><Pressable accessibilityRole="button" accessibilityLabel="시작 애니메이션 건너뛰기" onPress={finish} style={styles.skip}><Text style={styles.skipText}>건너뛰기  →</Text></Pressable></View>
    <View style={styles.brand}><Text style={styles.name}>북한이</Text><Text style={styles.tagline}>흩어진 소식, 선명한 시선.</Text></View>
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { transform: [{ translateX: shake }] }]}>
      <View style={[styles.ground, { top: height * 0.69 }]} />
      <Animated.View style={[styles.missile, { top: height * 0.69 - 100, left: width / 2 - 80, opacity: impact.interpolate({ inputRange: [0, 0.08, 1], outputRange: [1, 0, 0] }), transform: [{ translateY: fall.interpolate({ inputRange: [0, 1], outputRange: [-height * 0.6, 0] }) }, { translateX: fall.interpolate({ inputRange: [0, 1], outputRange: [-width * 0.5, 0] }) }, { rotate: '135deg' }] }]}>
        <View style={styles.trail} /><Ionicons name="rocket" size={160} color="#FFD4CC" />
      </Animated.View>
      {[0, 1, 2].map(i => <Animated.View key={i} style={[styles.ring, { left: width / 2 - 65, top: height * 0.69 - 65, opacity: impact.interpolate({ inputRange: [0, 0.04, 0.65, 1], outputRange: [0, 0.8, 0.25, 0] }), transform: [{ scale: impact.interpolate({ inputRange: [0, 1], outputRange: [0.1, 12 + i * 5] }) }] }]} />)}
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#FFE6BE', opacity: impact.interpolate({ inputRange: [0, 0.015, 0.14, 1], outputRange: [0, 0.9, 0, 0] }) }]} />
      <Animated.View style={{ position: 'absolute', left: width / 2 - 140, top: height * 0.69 - 220, width: 280, height: 240, opacity: impact.interpolate({ inputRange: [0, 0.12, 0.5, 1], outputRange: [0, 0.95, 0.9, 0.1] }), transform: [{ translateY: impact.interpolate({ inputRange: [0, 1], outputRange: [90, -90] }) }, { scale: impact.interpolate({ inputRange: [0, 1], outputRange: [0.15, 2.3] }) }] }}>
        <View style={{ position: 'absolute', width: 65, height: 150, left: 108, top: 90, borderRadius: 32, backgroundColor: '#F06A35' }} />
        <View style={{ position: 'absolute', width: 115, height: 165, left: 82, top: 65, borderRadius: 60, backgroundColor: '#FF9D42', opacity: 0.75 }} />
        {[{ x: 0, y: 40, size: 125 }, { x: 50, y: 5, size: 145 }, { x: 125, y: 25, size: 150 }, { x: 95, y: 0, size: 125 }].map((p, i) => <View key={i} style={{ position: 'absolute', left: p.x, top: p.y, width: p.size, height: p.size * 0.75, borderRadius: p.size / 2, backgroundColor: ['#A93624', '#E95A28', '#D94523', '#FFBB63'][i] }} />)}
        <View style={{ position: 'absolute', left: -20, bottom: -25, width: 320, height: 55, borderRadius: 100, backgroundColor: '#8F2C23', opacity: 0.65 }} />
      </Animated.View>
      <Animated.View style={[styles.burst, { left: width / 2 - 28, top: height * 0.69 - 28, opacity: impact.interpolate({ inputRange: [0, 0.04, 0.45, 1], outputRange: [0, 1, 0.3, 0] }), transform: [{ scale: impact.interpolate({ inputRange: [0, 1], outputRange: [0.1, 18] }) }] }]} />
    </Animated.View>
    <Text style={styles.bottom}>뉴스 · 행동 분석 · 대피소 · 기본 정보</Text>
  </Animated.View>;
}
const styles = StyleSheet.create({
  root: { zIndex: 100, backgroundColor: colors.background, overflow: 'hidden' },
  top: { zIndex: 10, padding: 24, paddingTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' },
  eyebrow: { color: '#B59D9A', fontSize: 9, letterSpacing: 1.5 }, skip: { padding: 12, minHeight: 44 }, skipText: { color: '#E3BAB4', fontSize: 12 },
  brand: { position: 'absolute', top: '23%', left: 24, right: 24, alignItems: 'center' }, name: { fontSize: 60, fontWeight: '900', color: colors.text, letterSpacing: -3 }, tagline: { color: colors.muted, fontSize: 14, marginTop: 12 },
  ground: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#652722' },
  missile: { position: 'absolute', width: 160, height: 160 }, trail: { position: 'absolute', width: 20, height: 230, top: 110, left: 35, backgroundColor: '#FF655B', opacity: 0.25, transform: [{ rotate: '45deg' }], borderRadius: 10 },
  ring: { position: 'absolute', width: 130, height: 130, borderRadius: 65, borderWidth: 1, borderColor: colors.accent }, burst: { position: 'absolute', width: 56, height: 56, borderRadius: 28, backgroundColor: '#FF957E' },
  bottom: { position: 'absolute', bottom: 40, left: 24, right: 24, textAlign: 'center', color: colors.muted, fontSize: 11, letterSpacing: 1 },
});
