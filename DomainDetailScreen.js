// ─────────────────────────────────────────────────────────────
// screens/DomainDetailScreen.js  —  1Life Hub
// Reads domain_xp from entries (set by DailyOpsScreen)
// ─────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl,
} from 'react-native';
import { habitsStore, entriesStore, goalsStore } from '../store';

const DOMAIN_COLORS = {
  physical:'#00FF87', mental:'#60a5fa', financial:'#fbbf24',
  spiritual:'#c084fc', emotional:'#f87171', personal:'#34d399',
};
const DOMAIN_ICONS = {
  physical:'💪', mental:'🧠', financial:'💰',
  spiritual:'🕊️', emotional:'❤️', personal:'⭐',
};
const DOMAIN_QUOTES = {
  physical:  'Your body is your greatest asset.',
  mental:    'The mind is the battlefield. Win there first.',
  financial: 'Build wealth, not just income.',
  spiritual: 'Peace comes from within.',
  emotional: 'Feel it. Process it. Grow from it.',
  personal:  "Become who you're meant to be.",
};

function GlassCard({ children, style, color }) {
  return (
    <View style={[s.glassCard, color && { borderColor: `${color}22` }, style]}>
      <View style={s.glassShine} pointerEvents="none" />
      {color && <View style={[s.accentLine, { backgroundColor: color }]} />}
      {children}
    </View>
  );
}

function StatTile({ value, label, color }) {
  return (
    <View style={[s.statTile, { borderColor: `${color}22` }]}>
      <Text style={[s.statVal, { color }]}>{value}</Text>
      <Text style={s.statLbl}>{label}</Text>
    </View>
  );
}

export default function DomainDetailScreen({ route, navigation }) {
  const { domain }  = route.params;
  const color       = DOMAIN_COLORS[domain] || '#00FF87';
  const label       = domain.charAt(0).toUpperCase() + domain.slice(1);

  const [habits,     setHabits]     = useState([]);
  const [goals,      setGoals]      = useState([]);
  const [entries,    setEntries]    = useState([]);
  const [domainXP,   setDomainXP]   = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [h, g, e] = await Promise.all([
      habitsStore.list(),
      goalsStore.list(),
      entriesStore.list(),
    ]);
    setHabits((Array.isArray(h) ? h : []).filter(x => x.domain === domain));
    setGoals((Array.isArray(g) ? g : []).filter(x => x.domain === domain));
    setEntries(Array.isArray(e) ? e : []);
    // Sum domain_xp from all entries for this domain
    const xp = (Array.isArray(e) ? e : []).reduce((sum, entry) => sum + (entry.domain_xp?.[domain] || 0), 0);
    setDomainXP(xp);
  }, [domain]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const activeHabits   = habits.filter(h => h.is_active !== false);
  const activeGoals    = goals.filter(g => g.status === 'active' || !g.status);
  const completedGoals = goals.filter(g => g.status === 'completed');

  // 7-day streak for this domain only
  const today = new Date();
  const streakDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const key = d.toISOString().split('T')[0];
    const hit = entries.some(e => e.date === key && (e.domain_xp?.[domain] || 0) > 0);
    const LABELS = ['M','T','W','T','F','S','S'];
    return { label: LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1], hit, isToday: i === 6 };
  });
  const streakCount = [...streakDays].reverse().findIndex(d => !d.hit);
  const streak = streakCount === -1 ? 7 : streakCount;

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color} />}
    >
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={[s.backArrow, { color }]}>←</Text>
        </TouchableOpacity>
        <View style={[s.domainBadge, { backgroundColor: `${color}15`, borderColor: `${color}33` }]}>
          <Text style={s.domainIcon}>{DOMAIN_ICONS[domain]}</Text>
          <Text style={[s.domainTitle, { color }]}>{label.toUpperCase()}</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Quote */}
      <View style={[s.quote, { borderLeftColor: color }]}>
        <Text style={s.quoteTxt}>"{DOMAIN_QUOTES[domain]}"</Text>
      </View>

      {/* Stats */}
      <View style={s.statRow}>
        <StatTile value={domainXP}            label="XP EARNED"  color={color} />
        <StatTile value={activeHabits.length} label="HABITS"     color={color} />
        <StatTile value={streak}              label="DAY STREAK" color={color} />
        <StatTile value={activeGoals.length}  label="GOALS"      color={color} />
      </View>

      {/* Streak */}
      <GlassCard color={color} style={{ padding: 14, marginBottom: 10 }}>
        <Text style={s.secLabel}>7-DAY STREAK</Text>
        <View style={s.calRow}>
          {streakDays.map((d, i) => (
            <View key={i} style={s.calDay}>
              <Text style={s.calLbl}>{d.label}</Text>
              <View style={[
                s.calDot,
                d.hit                  && { backgroundColor: `${color}40`, borderWidth: 1, borderColor: `${color}66` },
                d.isToday && d.hit     && { backgroundColor: color },
                d.isToday && !d.hit    && { borderWidth: 1.5, borderColor: `${color}66` },
              ]} />
            </View>
          ))}
        </View>
      </GlassCard>

      {/* Habits */}
      <Text style={s.secLabel}>HABITS</Text>
      {habits.length === 0 ? (
        <GlassCard style={{ padding: 24, alignItems: 'center' }}>
          <Text style={s.emptyTxt}>No habits in {label} yet.</Text>
          <TouchableOpacity
            style={[s.emptyBtn, { borderColor: color, backgroundColor: `${color}12` }]}
            onPress={() => navigation.navigate('Habits')}
          >
            <Text style={[s.emptyBtnTxt, { color }]}>ADD A HABIT →</Text>
          </TouchableOpacity>
        </GlassCard>
      ) : (
        <GlassCard color={color}>
          {habits.map((h, i) => (
            <View key={h.id}>
              <View style={s.habitRow}>
                <View style={[s.habitDot, { backgroundColor: color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.habitName, !h.is_active && s.dimmed]}>{h.name}</Text>
                  <Text style={s.habitMeta}>+{h.xp_value} XP per completion</Text>
                </View>
                <View style={[s.badge, h.is_active && { backgroundColor: `${color}22`, borderColor: `${color}55` }]}>
                  <Text style={[s.badgeTxt, h.is_active && { color }]}>{h.is_active ? 'ACTIVE' : 'OFF'}</Text>
                </View>
              </View>
              {i < habits.length - 1 && <View style={s.divider} />}
            </View>
          ))}
        </GlassCard>
      )}

      {/* Active Goals */}
      <Text style={s.secLabel}>ACTIVE GOALS</Text>
      {activeGoals.length === 0 ? (
        <GlassCard style={{ padding: 24, alignItems: 'center' }}>
          <Text style={s.emptyTxt}>No active goals in {label} yet.</Text>
          <TouchableOpacity
            style={[s.emptyBtn, { borderColor: color, backgroundColor: `${color}12` }]}
            onPress={() => navigation.navigate('Goals')}
          >
            <Text style={[s.emptyBtnTxt, { color }]}>ADD A GOAL →</Text>
          </TouchableOpacity>
        </GlassCard>
      ) : (
        <GlassCard color={color}>
          {activeGoals.map((g, i) => {
            const pct = g.progress || 0;
            return (
              <View key={g.id}>
                <View style={s.goalRow}>
                  <View style={s.goalHeader}>
                    <Text style={s.goalName} numberOfLines={1}>{g.title}</Text>
                    <Text style={[s.goalPct, { color }]}>{pct}%</Text>
                  </View>
                  <View style={s.goalTrack}>
                    <View style={[s.goalFill, { width: `${pct}%`, backgroundColor: color }]} />
                  </View>
                </View>
                {i < activeGoals.length - 1 && <View style={s.divider} />}
              </View>
            );
          })}
        </GlassCard>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <>
          <Text style={s.secLabel}>COMPLETED</Text>
          <GlassCard>
            {completedGoals.map((g, i) => (
              <View key={g.id}>
                <View style={s.completedRow}>
                  <View style={[s.checkCircle, { borderColor: color }]}>
                    <Text style={[s.checkMark, { color }]}>✓</Text>
                  </View>
                  <Text style={s.completedName} numberOfLines={1}>{g.title}</Text>
                </View>
                {i < completedGoals.length - 1 && <View style={s.divider} />}
              </View>
            ))}
          </GlassCard>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#050507' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 16, paddingBottom: 10 },
  backBtn:      { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backArrow:    { fontSize: 26, fontWeight: '300' },
  domainBadge:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 24, borderWidth: 1 },
  domainIcon:   { fontSize: 16 },
  domainTitle:  { fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },

  quote:        { marginHorizontal: 14, marginBottom: 14, padding: 14, borderLeftWidth: 2, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  quoteTxt:     { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', lineHeight: 18 },

  statRow:      { flexDirection: 'row', paddingHorizontal: 14, gap: 8, marginBottom: 12 },
  statTile:     { flex: 1, borderRadius: 14, padding: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, overflow: 'hidden' },
  statVal:      { fontSize: 20, fontWeight: '900' },
  statLbl:      { fontSize: 7, color: '#44445a', marginTop: 3, letterSpacing: 0.8 },

  secLabel:     { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6, fontSize: 9, color: '#44445a', letterSpacing: 2, fontWeight: '700' },

  glassCard:    { marginHorizontal: 14, marginBottom: 10, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.025)', overflow: 'hidden', padding: 16 },
  glassShine:   { position: 'absolute', top: 0, left: 0, right: 0, height: '45%', backgroundColor: 'rgba(255,255,255,0.04)', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  accentLine:   { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },

  calRow:       { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  calDay:       { alignItems: 'center', gap: 5 },
  calLbl:       { fontSize: 9, color: '#44445a' },
  calDot:       { width: 30, height: 30, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.04)' },

  habitRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  habitDot:     { width: 8, height: 8, borderRadius: 4 },
  habitName:    { fontSize: 13, fontWeight: '600', color: '#f0f0f0' },
  dimmed:       { opacity: 0.4 },
  habitMeta:    { fontSize: 10, color: '#44445a', marginTop: 2 },
  badge:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' },
  badgeTxt:     { fontSize: 8, color: '#44445a', fontWeight: '700', letterSpacing: 0.5 },

  goalRow:      { paddingVertical: 12 },
  goalHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  goalName:     { fontSize: 13, fontWeight: '600', color: '#f0f0f0', flex: 1, marginRight: 8 },
  goalPct:      { fontSize: 18, fontWeight: '900' },
  goalTrack:    { height: 5, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 3, overflow: 'hidden' },
  goalFill:     { height: '100%', borderRadius: 3 },

  completedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  checkCircle:  { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  checkMark:    { fontSize: 11, fontWeight: '700' },
  completedName:{ fontSize: 13, color: '#44445a', flex: 1 },

  divider:      { height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  emptyTxt:     { fontSize: 12, color: '#44445a', marginBottom: 14 },
  emptyBtn:     { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  emptyBtnTxt:  { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
});