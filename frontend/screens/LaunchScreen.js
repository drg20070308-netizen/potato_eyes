import { Text } from '../components/Typography';
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

export default function LaunchScreen({ onFinish }) {
  const windowSize = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [layout, setLayout] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;
  const { width, height } = layout || windowSize;

  // Separate clock-driven stages do not depend on the native animation driver.
  useEffect(() => {
    let cancelled = false;
    const start = Date.now();
    const timer = setInterval(() => setElapsed(Date.now() - start), 33);
    const end = setTimeout(() => finishRef.current(), 6000);
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (!cancelled) setReducedMotion(value);
    }).catch(() => {});
    return () => { cancelled = true; clearInterval(timer); clearTimeout(end); };
  }, []);

  const exploding = elapsed >= 2300;
  const flight = Math.min(1, Math.max(0, (elapsed - 200) / 2100));
  const growth = Math.min(1, Math.max(0, (elapsed - 2300) / 1100));
  const fade = reducedMotion ? 1 : Math.min(1, Math.max(0, (6000 - elapsed) / 450));
  const rocketScale = Math.min(1.35, width / 300, height / 550);
  const cloudScale = Math.min(width / 340, height / 470, 2.3);
  const impactY = height * 0.77;
  const impactX = width / 2;
  const startX = -70;
  const startY = Math.max(insets.top + 60, height * 0.12);
  const direction = Math.atan2(impactY - startY, impactX - startX);
  // Align the nose with the flight path and end precisely at the explosion.
  const endX = impactX - Math.cos(direction) * 95 * rocketScale;
  const endY = impactY - Math.sin(direction) * 95 * rocketScale;
  const travel = Math.pow(flight, 1.4);
  const cloudY = Math.max(height * 0.38, impactY - 290 * cloudScale);
  const shake = !reducedMotion && exploding && elapsed < 2800 ? Math.sin(elapsed / 28) * 7 : 0;

  return <View onLayout={({ nativeEvent: { layout: next } }) => setLayout(previous => previous?.width === next.width && previous?.height === next.height ? previous : { width: next.width, height: next.height })} style={[StyleSheet.absoluteFillObject, styles.root, { opacity: fade }]} accessibilityViewIsModal>
    <Image source={require('../assets/kim-jong-un.jpg')} resizeMode="cover" accessible={false} style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%', opacity: exploding ? 0.3 : 0.16 }]} />
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.tint]} />
    <View style={[styles.top, { paddingTop: insets.top + 16 }]}><Text style={styles.eyebrow}>NORTH KOREA · DAILY INTELLIGENCE</Text></View>
    <View style={styles.brand}><Text maxFontSizeMultiplier={1.2} style={[styles.name, { fontSize: Math.min(72, width * 0.18, height * 0.13) }]}>북한이</Text><Text maxFontSizeMultiplier={1.2} style={styles.tagline}>흩어진 소식, 선명한 시선.</Text></View>
    {!exploding && <View pointerEvents="none" style={[styles.rocket, {
      left: reducedMotion ? width / 2 - 80 : startX + (endX - startX) * travel - 80,
      top: reducedMotion ? height * 0.43 : startY + (endY - startY) * travel - 95,
      transform: [{ scale: rocketScale }, { rotate: `${direction * 180 / Math.PI + 90}deg` }],
    }]}>
      <View style={styles.rocketTrail} /><View style={styles.rocketFlame} />
      <View style={styles.rocketFinLeft} /><View style={styles.rocketFinRight} />
      <View style={styles.rocketBody}><View style={styles.rocketBand} /><View style={styles.rocketWindow} /></View>
      <View style={styles.rocketNose} />
    </View>}
    {exploding && <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.effects, { transform: [{ translateX: shake }] }]}>
      {!reducedMotion && elapsed < 2480 && <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#FFF3D6', opacity: 0.65 * (1 - (elapsed - 2300) / 180) }]} />}
      {[0, 1].map(i => <View key={i} style={[styles.shockwave, {
        width: width * (0.45 + growth * (1.5 + i * 0.4)), height: 70 + growth * 80,
        left: width / 2 - width * (0.45 + growth * (1.5 + i * 0.4)) / 2,
        top: impactY - 30, opacity: 0.8 - growth * 0.5,
      }]} />)}
      <View style={[styles.cloud, { left: width / 2 - 160, top: cloudY, transform: [{ scale: cloudScale * (reducedMotion ? 1 : 0.55 + growth * 0.45) }] }]}>
        <View style={styles.cloudStemOuter} /><View style={styles.cloudStem} />
        <View style={[styles.cloudLobe, { left: 2, top: 58, width: 135, height: 110 }]} />
        <View style={[styles.cloudLobe, { left: 62, top: 5, width: 165, height: 145 }]} />
        <View style={[styles.cloudLobe, { left: 165, top: 42, width: 150, height: 125 }]} />
        <View style={[styles.cloudLobe, { left: 90, top: 60, width: 160, height: 115, backgroundColor: '#FFDB94' }]} />
        <View style={styles.cloudBase} />
      </View>
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  root: { zIndex: 100, elevation: 100, backgroundColor: colors.background, overflow: 'hidden' },
  tint: { backgroundColor: 'rgba(196, 80, 80, 0.5)' },
  top: { zIndex: 10, paddingHorizontal: 24 },
  eyebrow: { color: colors.muted, fontSize: 9, letterSpacing: 1.5 },
  brand: { position: 'absolute', zIndex: 10, top: '20%', left: 24, right: 24, alignItems: 'center' },
  name: { fontSize: 72, fontWeight: '400', color: colors.text, letterSpacing: -3 },
  tagline: { color: colors.muted, fontSize: 14, marginTop: 12 },
  rocket: { position: 'absolute', zIndex: 20, width: 160, height: 190 },
  rocketBody: { position: 'absolute', left: 53, top: 30, width: 54, height: 110, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 2, borderColor: '#502323', overflow: 'hidden' },
  rocketNose: { position: 'absolute', left: 53, top: 0, width: 0, height: 0, borderLeftWidth: 27, borderRightWidth: 27, borderBottomWidth: 42, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#502323' },
  rocketBand: { position: 'absolute', top: 65, width: 54, height: 14, backgroundColor: '#C45050' },
  rocketWindow: { position: 'absolute', top: 20, left: 13, width: 24, height: 24, borderRadius: 12, backgroundColor: '#502323' },
  rocketFinLeft: { position: 'absolute', left: 27, top: 95, width: 35, height: 48, backgroundColor: '#502323', borderTopLeftRadius: 30 },
  rocketFinRight: { position: 'absolute', right: 27, top: 95, width: 35, height: 48, backgroundColor: '#502323', borderTopRightRadius: 30 },
  rocketFlame: { position: 'absolute', left: 62, top: 125, width: 36, height: 65, borderRadius: 24, backgroundColor: '#FFCC57', borderWidth: 7, borderColor: '#FF792F' },
  rocketTrail: { position: 'absolute', left: 72, top: 170, width: 16, height: 145, borderRadius: 20, backgroundColor: '#FFE5B2', opacity: 0.55 },
  effects: { zIndex: 20 },
  shockwave: { position: 'absolute', borderRadius: 300, borderWidth: 5, borderColor: '#FFD79B' },
  cloud: { position: 'absolute', width: 320, height: 310 },
  cloudStemOuter: { position: 'absolute', top: 110, left: 100, width: 120, height: 180, borderRadius: 60, backgroundColor: '#F28A48' },
  cloudStem: { position: 'absolute', top: 115, left: 128, width: 64, height: 175, borderRadius: 30, backgroundColor: '#FFE6AE' },
  cloudLobe: { position: 'absolute', borderRadius: 100, backgroundColor: '#FFBD6B', borderWidth: 3, borderColor: '#F28A48' },
  cloudBase: { position: 'absolute', bottom: 0, left: 0, width: 320, height: 60, borderRadius: 100, backgroundColor: '#FFCF86', borderWidth: 3, borderColor: '#F28A48' },
});
