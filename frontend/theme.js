import { StyleSheet } from 'react-native';
export const colors = { background: '#C45050', card: '#FFFFFF', border: 'rgba(255, 255, 255, 0.65)', accent: '#FFFFFF', accentSoft: '#FCEAEA', text: '#FFFFFF', muted: '#FFEDED', cardText: '#292929', cardMuted: '#666666', cardAccent: '#C45050', cardBorder: '#B87575' };
export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { color: colors.text, fontSize: 15, fontWeight: '800', letterSpacing: 2 },
  caption: { color: colors.muted, fontSize: 12, marginTop: 5 },
  notification: { padding: 10 }, badge: { position: 'absolute', right: 3, top: 3, backgroundColor: colors.accent, borderRadius: 10, minWidth: 17, alignItems: 'center' }, badgeText: { color: colors.background, fontWeight: '800', fontSize: 11 },
  tabs: { flexDirection: 'row', borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.background, paddingVertical: 12 },
  tab: { flex: 1, alignItems: 'center', gap: 6, minHeight: 44 }, tabLabel: { fontSize: 11, fontWeight: '600' },
  page: { padding: 24, paddingTop: 12, paddingBottom: 32, gap: 16 },
  title: { color: colors.text, fontSize: 30, fontWeight: '800', letterSpacing: -1 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  card: { padding: 20, borderRadius: 22, borderWidth: 1.5, borderColor: colors.cardBorder, backgroundColor: colors.card, gap: 12 },
  cardHeading: { color: colors.cardText, fontSize: 19, fontWeight: '700', lineHeight: 28 },
  cardSubtitle: { color: colors.cardMuted, fontSize: 14, lineHeight: 22 },
  cardCaption: { color: colors.cardMuted, fontSize: 12, marginTop: 5 },
  cardLabel: { color: colors.cardAccent, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  heading: { color: colors.text, fontSize: 19, fontWeight: '700', lineHeight: 28 },
  label: { color: colors.accent, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: colors.cardBorder, backgroundColor: colors.card },
});
