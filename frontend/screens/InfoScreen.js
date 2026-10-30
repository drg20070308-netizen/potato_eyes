import { Text } from '../components/Typography';
import React, { useState } from 'react';
import { ScrollView, Pressable, View, Linking } from 'react-native';
import { styles as s } from '../theme';
const facts = [
  {
    title: '선전·정보 통제와 인권침해', basis: '유엔 북한인권조사위원회(COI), 2014년 조사 결과',
    lines: [
      '유엔 조사위는 국가 주도의 사상 주입과 정보 통제가 사상·표현의 자유를 심각하게 제약한다고 지적했습니다.',
      '정치범수용소와 구금시설에서 고문·강제노동·처형 등 중대한 침해가 발생했다고 보고했습니다.',
      '정치적·종교적 박해와 가족에 대한 연좌 처벌, 이동의 자유 제한도 조사 대상에 포함됐습니다.',
      '조사위는 확인된 침해 중 다수가 반인도범죄에 해당한다고 판단했습니다.',
    ],
    sources: [{ label: '유엔 OHCHR · 북한인권조사위원회 자료', url: 'https://seoul.ohchr.org/en/node/400' }],
  },
  {
    title: '북한 기본 정보', basis: '유엔 통계국 UNData 국가 개요 · 인구는 2025년 추계',
    lines: [
      '공식 국명은 조선민주주의인민공화국(DPRK)이며, 수도는 평양입니다.',
      '유엔 통계의 2025년 추계 인구는 약 2,657만 명입니다.',
      '유엔 가입일은 1991년 9월 17일입니다.',
      '유엔 통계는 북한을 동아시아 지역으로 분류합니다.',
    ],
    sources: [{ label: '유엔 통계국 · 북한 국가 개요', url: 'https://data.un.org/legacy/en/iso/kp.html' }],
  },
];
const items = [
  ['앱 소개', '북한이는 안전 뉴스, 활동 기록, 대피소 정보를 한곳에서 확인하기 위한 앱입니다. 공개 보도와 출처 자료를 바탕으로 정보를 제공합니다.'],
  ['비상용품 준비', '식수, 손전등, 보조 배터리 등 필요한 물품을 준비하고 정기적으로 상태를 확인하세요.'],
  ['대피 전 확인', '가족과 연락 방법을 정하고, 실제 상황에서는 관계 기관의 최신 안내에 따라 이동하세요.'],
  ['데이터 안내', '뉴스는 네이버 검색 자료를 바탕으로 AI가 요약합니다. 행동 분석은 AI의 해석이며, 미사일 알림은 뉴스 기반입니다. 지도는 예시이며 위치 수집은 수행하지 않습니다.'],
];
export default function InfoScreen() {
  const [open, setOpen] = useState(0);
  return <ScrollView contentContainerStyle={s.page}><Text style={s.label}>ESSENTIAL GUIDE</Text><Text style={s.title}>기본 정보</Text>
    {facts.map(section => <View key={section.title} style={s.card}>
      <Text style={s.cardHeading}>{section.title}</Text>
      {section.lines.map((line, index) => <Text variant="default" key={index} style={s.cardSubtitle}>{index + 1}. {line}</Text>)}
      <Text variant="default" style={s.cardCaption}>{section.basis}</Text>
      {section.sources.map(source => <Pressable key={source.url} accessibilityRole="link" onPress={() => Linking.openURL(source.url).catch(() => {})}><Text variant="default" style={s.cardLabel}>{source.label} ↗</Text></Pressable>)}
    </View>)}
    {items.map(([title, body], i) => <Pressable key={title} accessibilityRole="button" accessibilityState={{ expanded: open === i }} onPress={() => setOpen(open === i ? null : i)} style={s.card}><Text style={s.cardHeading}>{title} {open === i ? '−' : '+'}</Text>{open === i && <Text variant="default" style={s.cardSubtitle}>{body}</Text>}</Pressable>)}<Text variant="default" style={[s.caption, { textAlign: 'center' }]}>북한이 · VERSION 1.0.0</Text>
  </ScrollView>;
}

