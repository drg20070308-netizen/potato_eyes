import React, { forwardRef } from 'react';
import { Text as NativeText, TextInput as NativeTextInput, StyleSheet } from 'react-native';
import { isLoaded } from 'expo-font';

// Set to false to restore Noto Sans KR, preserving the launch title's own font.
const useSerif = true;
const serifFamily = 'NotoSerifKR_400Regular';

function fontStyle(style, variant) {
  const resolved = StyleSheet.flatten(style);
  if (resolved?.fontFamily) return {};
  if (useSerif && variant !== 'default' && isLoaded(serifFamily)) return { fontFamily: serifFamily, fontWeight: '400' };
  const weight = Number(resolved?.fontWeight || 400);
  const family = weight >= 700 ? 'NotoSansKR_700Bold' : weight >= 500 ? 'NotoSansKR_600SemiBold' : 'NotoSansKR_400Regular';
  return isLoaded(family) ? { fontFamily: family, fontWeight: 'normal' } : {};
}

export const Text = forwardRef(function Text({ style, variant, ...props }, ref) {
  return <NativeText ref={ref} {...props} style={[style, fontStyle(style, variant)]} />;
});

export const TextInput = forwardRef(function TextInput({ style, ...props }, ref) {
  return <NativeTextInput ref={ref} {...props} style={[style, fontStyle(style)]} />;
});
