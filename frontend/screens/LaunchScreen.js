import { Text } from '../components/Typography';
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { getLaunchGeometry } from './launchGeometry.mjs';

const IMPACT = 2300;
const END = 7200;
const clamp = value => Math.min(1, Math.max(0, value));
const sparks = Array.from({ length: 20 }, (_, i) => ({ angle: Math.PI + (i + 0.5) / 20 * Math.PI, speed: 0.45 + (i % 5) * 0.12, size: 4 + i % 4 * 2 }));
const lobes = [
  [8,76,124,98,'#E67D40'],[68,24,150,132,'#F59A4D'],[178,60,134,108,'#E67D40'],
  [25,64,116,94,'#FFBC62'],[93,12,140,120,'#FFD88A'],[190,76,110,88,'#FFBC62'],
  [79,78,150,108,'#FFE8AB'],[44,116,102,54,'#EF9955'],[177,119,102,54,'#EF9955'],
];

export default function LaunchScreen({ onFinish }) {
  const windowSize = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [layout, setLayout] = useState(null);
  const [brandHeight, setBrandHeight] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;
  const { width, height } = layout || windowSize;
  const initial = getLaunchGeometry(width, height, insets);
  const g = getLaunchGeometry(width, height, insets, brandHeight == null ? undefined : initial.brandTop + brandHeight);

  useEffect(() => {
    let cancelled = false;
    const start = Date.now();
    const timer = setInterval(() => setElapsed(Date.now() - start), 33);
    const end = setTimeout(() => finishRef.current(), END);
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (!cancelled) setReducedMotion(value); }).catch(() => {});
    return () => { cancelled = true; clearInterval(timer); clearTimeout(end); };
  }, []);

  const exploding = elapsed >= IMPACT;
  const flight = Math.pow(clamp((elapsed - 200) / 2100), 1.4);
  const growth = reducedMotion ? 1 : clamp((elapsed - IMPACT) / 1400);
  const age = Math.max(0, elapsed - IMPACT);
  const cloudScale = g.cloudScale * (0.4 + growth * 0.6);
  const shake = !reducedMotion && age > 0 && age < 550 ? Math.sin(age / 35) * 5 : 0;
  const artworkOpacity = reducedMotion ? 1 : clamp((END - elapsed) / 450);
  const flash = reducedMotion || !exploding ? 0 : 0.95 * (1 - clamp(age / 400));
  const cloudCenterY = g.groundY - 170 * cloudScale;

  // Root stays opaque until unmount: app header and tabs never bleed through.
  return <View onLayout={({ nativeEvent: { layout: next } }) => setLayout(previous => previous?.width === next.width && previous?.height === next.height ? previous : { width: next.width, height: next.height })} style={[StyleSheet.absoluteFillObject, styles.root]} accessibilityViewIsModal>
    <Image source={require('../assets/kim-jong-un.jpg')} resizeMode="cover" accessible={false} style={[StyleSheet.absoluteFillObject, styles.background, { width: '100%', height: '100%', opacity: exploding ? 0.3 : 0.16 }]} />
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.tint]} />
    {flash > 0 && <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.flash, { opacity: flash }]} />}
    <View style={[styles.top, { paddingTop: insets.top + 16 }]}><Text style={styles.eyebrow}>NORTH KOREA · DAILY INTELLIGENCE</Text></View>
    <View onLayout={({ nativeEvent }) => setBrandHeight(nativeEvent.layout.height)} style={[styles.brand, { top: g.brandTop }]}>
      <Text maxFontSizeMultiplier={1.2} style={[styles.name, { fontSize: g.titleSize }]}>북한이</Text>
      <Text maxFontSizeMultiplier={1.2} style={styles.tagline}>흩어진 소식, 선명한 시선.</Text>
    </View>

    {!exploding && <View pointerEvents="none" style={[styles.rocket, {
      width: g.rocketSize, height: g.rocketSize,
      left: (reducedMotion ? width / 2 : g.startX + (g.endX - g.startX) * flight) - g.rocketSize / 2,
      top: (reducedMotion ? g.stageTop + g.rocketSize / 2 : g.startY + (g.endY - g.startY) * flight) - g.rocketSize / 2,
      transform: [{ rotate: `${g.rotation}deg` }],
    }]}>
      <View style={[styles.trail, { left: g.rocketSize * 0.06, top: g.rocketSize * 0.63, width: g.rocketSize * 0.16, height: g.rocketSize * 0.8 }]} />
      <Ionicons name="rocket" size={g.rocketSize} color="#FFFFFF" style={{ width: g.rocketSize, height: g.rocketSize, lineHeight: g.rocketSize }} />
    </View>}

    {exploding && <View pointerEvents="none" style={[styles.stage, { top: g.stageTop, bottom: insets.bottom + 16, opacity: artworkOpacity, transform: [{ translateX: shake }] }]}>
      <View style={[styles.halo, { width: width * 1.25, height: width * 1.25, left: -width * 0.125, top: cloudCenterY - g.stageTop - width * 0.625, opacity: 0.12 + (1 - growth) * 0.2 }]} />
      {[0,1,2].map(i => {
        const diameter = width * (0.3 + growth * (1.1 + i * 0.3));
        return <View key={i} style={[styles.shockwave, { width: diameter, height: 45 + growth * (65 + i * 16), left: (width - diameter) / 2, top: g.groundY - g.stageTop - 28, opacity: 0.9 - growth * 0.55, borderWidth: i === 0 ? 5 : 2 }]} />;
      })}
      {!reducedMotion && sparks.map((spark,i) => {
        const distance = Math.min(width * 0.7, height * 0.4) * growth * spark.speed;
        return <View key={i} style={[styles.spark, { width: spark.size, height: spark.size * 2.5, left: width / 2 + Math.cos(spark.angle) * distance, top: g.groundY - g.stageTop + Math.sin(spark.angle) * distance - 22, opacity: 1 - growth * 0.75, transform: [{ rotate: `${spark.angle * 180 / Math.PI + 90}deg` }] }]} />;
      })}
      <View style={[styles.cloud, { left: width / 2 - 160, top: cloudCenterY - g.stageTop - 170, transform: [{ scale: cloudScale }] }]}>
        <View style={styles.stemSmoke} /><View style={styles.stemOuter} /><View style={styles.stemCore} />
        {[0,1,2].map(i => <View key={i} style={[styles.stemRing,{ top: 180 + i * 34, left: 98 - i * 7, width: 124 + i * 14 }]} />)}
        {lobes.map(([left,top,w,h,color],i) => <View key={i} style={[styles.lobe,{ left,top,width:w,height:h,backgroundColor:color }]} />)}
        <View style={styles.cloudHighlight} />
        <View style={styles.baseSmoke} /><View style={styles.baseFire} /><View style={styles.baseCore} />
      </View>
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  root: { zIndex: 100, elevation: 100, backgroundColor: colors.background, overflow: 'hidden' },
  background: { zIndex: 0 }, tint: { zIndex: 1, backgroundColor: 'rgba(90, 20, 25, 0.35)' },
  flash: { zIndex: 2, backgroundColor: '#FFF8DF' },
  top: { zIndex: 50, paddingHorizontal: 24 }, eyebrow: { color: colors.muted, fontSize: 9, letterSpacing: 1.5 },
  brand: { position: 'absolute', zIndex: 50, left: 24, right: 24, alignItems: 'center' },
  name: { fontWeight: '400', color: colors.text, letterSpacing: -3 }, tagline: { color: colors.muted, fontSize: 14, marginTop: 12 },
  rocket: { position: 'absolute', zIndex: 20 },
  trail: { position: 'absolute', borderRadius: 40, backgroundColor: '#FFCC70', opacity: 0.65, transform: [{ rotate: '45deg' }] },
  stage: { position: 'absolute', zIndex: 20, left: 0, right: 0, overflow: 'hidden' },
  halo: { position: 'absolute', borderRadius: 1000, backgroundColor: '#FFD582' },
  shockwave: { position: 'absolute', borderRadius: 400, borderColor: '#FFE6B2' },
  spark: { position: 'absolute', borderRadius: 8, backgroundColor: '#FFF2BB' },
  cloud: { position: 'absolute', width: 320, height: 340 },
  stemSmoke: { position: 'absolute', top: 112, left: 83, width: 154, height: 195, borderRadius: 85, backgroundColor: '#A65648' },
  stemOuter: { position: 'absolute', top: 115, left: 105, width: 110, height: 200, borderRadius: 56, backgroundColor: '#F39A4F' },
  stemCore: { position: 'absolute', top: 120, left: 133, width: 54, height: 200, borderRadius: 28, backgroundColor: '#FFE1A0' },
  stemRing: { position: 'absolute', height: 24, borderRadius: 40, borderWidth: 3, borderColor: '#E9A36C', backgroundColor: 'rgba(255, 218, 151, 0.45)' },
  lobe: { position: 'absolute', borderRadius: 100, borderWidth: 2, borderColor: '#D5804A' },
  cloudHighlight: { position: 'absolute', top: 48, left: 123, width: 77, height: 50, borderRadius: 60, backgroundColor: '#FFF2C8' },
  baseSmoke: { position: 'absolute', bottom: 0, left: 0, width: 320, height: 58, borderRadius: 100, backgroundColor: '#AF6652' },
  baseFire: { position: 'absolute', bottom: 5, left: 12, width: 296, height: 48, borderRadius: 100, backgroundColor: '#F9AD61' },
  baseCore: { position: 'absolute', bottom: 13, left: 49, width: 222, height: 26, borderRadius: 70, backgroundColor: '#FFE9AF' },
});
