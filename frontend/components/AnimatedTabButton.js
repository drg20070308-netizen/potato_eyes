import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Typography';
import { colors, styles as s } from '../theme';

export default function AnimatedTabButton({ label, icon, selected, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const reducedMotion = useRef(false);

  useEffect(() => {
    let active = true;
    const update = value => {
      reducedMotion.current = value;
      if (value) { scale.stopAnimation(); scale.setValue(1); }
    };
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) update(value); }).catch(() => {});
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', update);
    return () => { active = false; listener.remove(); scale.stopAnimation(); };
  }, [scale]);

  const pressIn = () => {
    if (reducedMotion.current) return;
    scale.stopAnimation();
    Animated.timing(scale, { toValue: 0.9, duration: 90, useNativeDriver: false }).start();
  };
  const release = () => {
    if (reducedMotion.current) return;
    scale.stopAnimation();
    Animated.spring(scale, { toValue: 1, speed: 20, bounciness: 9, useNativeDriver: false }).start();
  };
  const color = selected ? colors.accent : colors.muted;
  const iconName = selected ? icon.replace(/-outline$/, '') : icon;
  return <Pressable accessibilityRole="tab" accessibilityState={{ selected }} accessibilityLabel={label}
    onPressIn={pressIn} onPressOut={release} onPress={() => { release(); onPress(); }}
    style={{ flex: 1, minHeight: 44 }}>
    <Animated.View pointerEvents="none" style={[s.tab, { transform: [{ scale }] }]}>
      <Ionicons name={iconName} size={23} color={color} />
      <Text style={[s.tabLabel, { color }]}>{label}</Text>
    </Animated.View>
  </Pressable>;
}
