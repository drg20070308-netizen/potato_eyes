import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, ActivityIndicator, Linking, Platform } from 'react-native';
import { colors, styles as s } from '../theme';
import { readPosition, locationFailure } from '../shelterLocation.mjs';
const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://potato-eyes.onrender.com';
const messages = { REGION_NOT_FOUND: '지역 위치를 확인하지 못했습니다. 시·구·동을 함께 입력해 주세요.', AMBIGUOUS_REGION: '같은 이름의 지역이 여러 곳입니다. 시·구·동을 함께 입력해 주세요.', NOT_CONFIGURED: '서버에 KAKAO_REST_API_KEY 설정이 필요합니다.', INVALID_QUERY: '지역명 또는 대한민국 내 위치를 확인해 주세요.', PROVIDER_LIMIT: '검색 제공자의 호출 한도를 초과했습니다. 잠시 후 재시도해 주세요.', PROVIDER_DISABLED: '카카오맵 API가 비활성화되어 있습니다. 카카오 Developers에서 앱 → 제품 설정 → 카카오맵 → 활성화 설정을 ON으로 변경해 주세요.', PROVIDER_UNAUTHORIZED: '서버의 카카오 REST API 키 또는 API 사용 권한을 확인해 주세요.', PROVIDER_UNAVAILABLE: '카카오 검색 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.' };
export default function ShelterScreen() {
  const [region, setRegion] = useState('');
  const [searchMode, setSearchMode] = useState('region');
  const [radius, setRadius] = useState(3000);
  const [coords, setCoords] = useState(null);
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(null), generation = useRef(0), mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; generation.current++; request.current?.abort(); }; }, []);
  async function search(position = null, distance = radius, token, mode = 'region') {
    const id = token ?? ++generation.current;
    request.current?.abort();
    if (!position && !region.trim()) { setError('시·군·구 또는 동 이름을 입력해 주세요.'); return; }
    const controller = new AbortController(); request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 90000);
    setLoading(true); setError(''); setData(null); setSelected(null); setCoords(position); setSearchMode(mode);
    try {
      const query = position ? `lat=${position.latitude}&lng=${position.longitude}&radius=${distance}` : `region=${encodeURIComponent(region.trim())}&mode=${mode}&radius=${distance}`;
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/shelters?${query}`, { signal: controller.signal });
      const result = await response.json();
      if (!response.ok) throw new Error(messages[result.error] || '대피소 검색 서버에 연결하지 못했습니다. 다시 시도해 주세요.');
      if (!Array.isArray(result.shelters)) throw new Error('대피소 응답 형식을 확인할 수 없습니다.');
      if (mounted.current && id === generation.current) { setData(result); setSelected(result.shelters[0]?.id ?? null); }
    } catch (e) { if (mounted.current && id === generation.current) setError(e.name === 'AbortError' ? '검색 시간이 초과되었습니다. 다시 시도해 주세요.' : e.message); }
    finally { clearTimeout(timeout); if (mounted.current && id === generation.current) setLoading(false); }
  }
  function locate() {
    if (Platform.OS !== 'web' || !globalThis.navigator?.geolocation) { setError('현재 위치 검색은 HTTPS 웹에서 지원합니다. 앱에서는 지역명을 입력해 검색해 주세요.'); return; }
    const id = ++generation.current; request.current?.abort(); setLoading(false); setLocating(true); setError(''); setData(null);
    globalThis.navigator.geolocation.getCurrentPosition(result => {
      if (!mounted.current || id !== generation.current) return;
      const position = readPosition(result);
      setLocating(false);
      if (!position) { setCoords(null); setError(locationFailure()); return; }
      if (position.latitude < 33 || position.latitude > 39 || position.longitude < 124 || position.longitude > 132) {
        setCoords(null); setError('현재 좌표가 대한민국 검색 범위 밖입니다. 지역명을 입력해 검색해 주세요.'); return;
      }
      search(position, radius, id);
    }, error => { if (mounted.current && id === generation.current) { setLocating(false); setCoords(null); setError(locationFailure(error?.code)); } }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  }
  async function open(url) { try { await Linking.openURL(url); } catch { setError('지도를 열지 못했습니다. 다시 시도해 주세요.'); } }
  const active = data?.shelters.find(item => item.id === selected);
  const busy = loading || locating;
  return <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
    <Text style={s.label}>SHELTER FINDER</Text><Text style={s.title}>대피소 찾기</Text>
    <Text style={s.subtitle}>지역명으로 민방위 대피소를 검색하고 이동 경로를 확인하세요.</Text>
    <View style={s.card}>
      <Text style={s.heading}>어디에서 찾으시나요?</Text>
      <TextInput accessibilityLabel="대피소 검색 지역" placeholder="예: 서울 강남구 역삼동" placeholderTextColor={colors.muted} value={region} onChangeText={setRegion} maxLength={80} returnKeyType="search" onSubmitEditing={() => !busy && search()} style={{ color: colors.text, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14 }} />
      <Pressable accessibilityRole="button" disabled={busy} style={s.chip} onPress={() => search()}><Text style={s.label}>지역 검색</Text></Pressable>
      <Pressable accessibilityRole="button" disabled={busy} style={s.chip} onPress={() => search(null, radius, undefined, 'nearby')}><Text style={s.label}>입력 지역 주변 반경 검색</Text></Pressable>
      <Pressable accessibilityRole="button" disabled={busy} style={s.chip} onPress={locate}><Text style={s.label}>◎ 내 위치 주변 검색 · 웹</Text></Pressable>
      <Text style={s.caption}>현재 위치는 버튼을 누를 때만 요청하며 서버에 저장하지 않습니다.</Text>
      <Text style={s.caption}>반경: 입력 지역 주변 반경 검색 / 내 위치 주변 검색에 적용됩니다. 지역 검색은 해당 구·동 안만 찾습니다.</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{[1000, 3000, 5000, 10000, 20000].map(value => <Pressable accessibilityRole="button" accessibilityState={{ selected: radius === value }} key={value} disabled={busy} onPress={() => { setRadius(value); if (coords) search(coords, value); else if (data && searchMode === 'nearby') search(null, value, undefined, 'nearby'); }} style={[s.chip, radius === value && { borderColor: colors.accent }]}><Text style={s.label}>{value / 1000}km</Text></Pressable>)}</View>
    </View>
    <Text style={s.caption}>사하구·사상구는 구청 공식 시설 목록을 우선 검색하며, 다른 지역은 카카오 장소 검색을 사용합니다. 개방 여부는 시설에 확인하세요. 거리는 직선거리입니다.</Text>
    {busy && <View accessibilityLiveRegion="polite"><ActivityIndicator color={colors.accent} /><Text style={s.subtitle}>{locating ? '현재 위치 확인 중…' : '대피소 검색 중…'}</Text></View>}
    {!!error && <Text accessibilityRole="alert" style={s.subtitle}>{error}</Text>}
    {data?.coverage && <Text style={s.caption}>{data.coverage}</Text>}
    {data?.center && <Text style={s.caption}>검색 중심 · {data.center.label} / 반경 {data.center.radius / 1000}km</Text>}
    {data?.coordinateMissing > 0 && <Text style={s.caption}>좌표 미확인 시설 {data.coordinateMissing}곳 · 반경 검색에서는 제외됩니다.</Text>}
    {data && <Text style={s.label}>검색 결과 {data.shelters.length}곳{data.hasMore ? ' · 일부 결과, 지역을 더 구체적으로 입력해 주세요' : ''}</Text>}
    {data && !data.shelters.length && <Text style={s.subtitle}>검색 결과가 없습니다. 다른 지역명이나 더 넓은 반경으로 검색해 주세요. 결과가 없더라도 주변에 대피소가 없다는 뜻은 아닙니다.</Text>}
    {active && <View style={s.card}><Text style={s.label}>선택한 시설</Text><Text style={s.heading}>{active.name}</Text><Text style={s.subtitle}>{active.address}</Text><Pressable accessibilityRole="link" onPress={() => open((active.lat != null && active.lng != null ? `https://map.kakao.com/link/map/${encodeURIComponent(active.name)},${active.lat},${active.lng}` : active.mapUrl || `https://map.kakao.com/link/search/${encodeURIComponent(active.name + ' ' + active.address)}`))} style={s.chip}><Text style={s.label}>지도에서 위치 보기 ↗</Text></Pressable><Pressable accessibilityRole="link" onPress={() => open((active.lat != null && active.lng != null ? `https://map.kakao.com/link/to/${encodeURIComponent(active.name)},${active.lat},${active.lng}` : active.mapUrl || `https://map.kakao.com/link/search/${encodeURIComponent(active.name + ' ' + active.address)}`))} style={s.chip}><Text style={s.label}>카카오맵 길찾기 ↗</Text></Pressable></View>}
    {data?.shelters.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: selected === item.id }} onPress={() => setSelected(item.id)} style={[s.card, selected === item.id && { borderColor: colors.accent }]}><Text style={s.heading}>{item.name}</Text><Text style={s.subtitle}>{item.address}</Text><Text style={s.label}>{item.distance == null ? '지역명 검색 · 거리 미제공' : item.distance < 1000 ? `직선거리 ${item.distance}m` : `직선거리 ${(item.distance / 1000).toFixed(1)}km`}</Text>{!!item.phone && <Text style={s.caption}>시설 연락처 · {item.phone}</Text>}</Pressable>)}
    {data && <Text style={s.caption}>출처 · {data.source} / 조회 {new Date(data.checkedAt).toLocaleString('ko-KR')}</Text>}
  </ScrollView>;
}
