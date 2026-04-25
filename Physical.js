// ─────────────────────────────────────────────────────────────
// screens/Physical.js  —  1Life Hub
// Sleep, water, movement sliders. Auto-saves on release.
// ─────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { healthStore } from '../store';
import { COLORS } from '../constants/colors';

const GREEN   = COLORS.neon;
const BLUE    = '#60a5fa';
const AMBER   = '#fbbf24';

// ── Metric config ─────────────────────────────────────────────
const METRICS = [
  {
    key:   'sleep',
    label: 'Sleep',
    unit:  'hrs',
    max:   12,
    step:  0.5,
    color: BLUE,
    goal:  8,
    tip:   'Aim for 7–9 hours',
  },
  {
    key:   'water',
    label: 'Water',
    unit:  'glasses',
    max:   10,
    step:  1,
    color: GREEN,
    goal:  8,
    tip:   'Aim for 8 glasses',
  },
  {
    key:   'movement',
    label: 'Movement',
    unit:  'mins',
    max:   120,
    step:  5,
    color: AMBER,
    goal:  60,
    tip:   'Aim for 60 minutes',
  },
];

// ── Helper: format logged_at time ─────────────────────────────
function formatTime(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

// ── Single metric slider card ─────────────────────────────────
function MetricCard({ metric, value, onChange }) {
  const { label, unit, max, step, color, goal, tip } = metric;
  const pct      = value / max;
  const atGoal   = value >= goal;

  return (
    <View style={[s.metricCard, { borderColor: `${color}25` }]}>
      {/* Top accent line */}
      <View style={[s.accentLine, { backgroundColor: color }]} />

      <View style={s.metricHeader}>
        <Text style={s.metricLabel}>{label}</Text>
        <View style={[s.valuePill, { backgroundColor: `${color}18`, borderColor: `${color}30` }]}>
          <Text style={[s.valueNum, { color }]}>{value % 1 === 0 ? value : value.toFixed(1)}</Text>
          <Text style={[s.valueUnit, { color }]}> {unit}</Text>
        </View>
      </View>

      <Slider
        style={s.slider}
        minimumValue={0}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={color}
        maximumTrackTintColor="rgba(255,255,255,0.07)"
        thumbTintColor={color}
      />

      <View style={s.metricFooter}>
        <Text style={s.metricTip}>{tip}</Text>
        {atGoal && (
          <View style={[s.goalBadge, { backgroundColor: `${color}18` }]}>
            <Text style={[s.goalBadgeTxt, { color }]}>Goal hit</Text>
          </View>
        )}
      </View>

      {/* Mini progress bar */}
      <View style={s.miniTrack}>
        <View style={[s.miniFill, { width: `${Math.min(pct * 100, 100)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

// ── 7-day history strip ───────────────────────────────────────
function HistoryStrip({ entries }) {
  const today = new Date();
  const days  = Array.from({ length: 7 }, (_, i) => {
    const d   = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const key = d.toISOString().split('T')[0];
    const e   = entries.find(x => x.date === key);
    const LABELS = ['M','T','W','T','F','S','S'];
    return {
      label:    LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1],
      isToday:  i === 6,
      sleep:    e ? Math.min((e.sleep    || 0) / 8,   1) : 0,
      water:    e ? Math.min((e.water    || 0) / 8,   1) : 0,
      movement: e ? Math.min((e.movement || 0) / 60,  1) : 0,
    };
  });

  return (
    <View style={s.historyCard}>
      <Text style={s.secLabel}>7-DAY HISTORY</Text>
      <View style={s.historyRow}>
        {days.map((d, i) => (
          <View key={i} style={s.historyDay}>
            <Text style={[s.historyLbl, d.isToday && { color: GREEN }]}>{d.label}</Text>
            {/* 3 stacked bars */}
            <View style={s.barStack}>
              <View style={s.barTrack}>
                <View style={[s.barFill, { height: `${d.sleep * 100}%`, backgroundColor: BLUE }]} />
              </View>
              <View style={s.barTrack}>
                <View style={[s.barFill, { height: `${d.water * 100}%`, backgroundColor: GREEN }]} />
              </View>
              <View style={s.barTrack}>
                <View style={[s.barFill, { height: `${d.movement * 100}%`, backgroundColor: AMBER }]} />
              </View>
            </View>
          </View>
        ))}
      </View>
      {/* Legend */}
      <View style={s.legendRow}>
        {[['Sleep', BLUE], ['Water', GREEN], ['Movement', AMBER]].map(([l, c]) => (
          <View key={l} style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: c }]} />
            <Text style={s.legendTxt}>{l}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// PHYSICAL SCREEN
// ─────────────────────────────────────────────────────────────
export default function PhysicalScreen({ navigation }) {
  const [sleep,     setSleep]     = useState(0);
  const [water,     setWater]     = useState(0);
  const [movement,  setMovement]  = useState(0);
  const [loggedAt,  setLoggedAt]  = useState(null);
  const [allEntries,setAllEntries]= useState([]);
  const [refreshing,setRefreshing]= useState(false);

  const load = useCallback(async () => {
    const [today, all] = await Promise.all([
      healthStore.getToday(),
      healthStore.list(),
    ]);
    if (today) {
      setSleep(today.sleep       || 0);
      setWater(today.water       || 0);
      setMovement(today.movement || 0);
      setLoggedAt(today.logged_at);
    }
    setAllEntries(Array.isArray(all) ? all : []);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  // Auto-save when a slider is released
  const save = async (patch) => {
    const current = { sleep, water, movement, ...patch };
    const entry = await healthStore.saveToday(current);
    setLoggedAt(entry.logged_at);
    // Update local state to match saved values
    if (patch.sleep    !== undefined) setSleep(patch.sleep);
    if (patch.water    !== undefined) setWater(patch.water);
    if (patch.movement !== undefined) setMovement(patch.movement);
    // Refresh history strip
    const all = await healthStore.list();
    setAllEntries(Array.isArray(all) ? all : []);
  };

  // Overall score for display
  const sleepScore    = Math.min(sleep    / 8,   1);
  const waterScore    = Math.min(water    / 8,   1);
  const movementScore = Math.min(movement / 60,  1);
  const overallScore  = Math.round(((sleepScore + waterScore + movementScore) / 3) * 100);

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />}
    >
      {/* Background glow */}
      <View style={s.bgGlow} />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Physical Health</Text>
          <Text style={s.sub}>
            {loggedAt ? `Last logged ${formatTime(loggedAt)}` : 'Log today\'s metrics'}
          </Text>
        </View>
        <View style={s.scorePill}>
          <Text style={s.scoreNum}>{overallScore}</Text>
          <Text style={s.scorePct}>%</Text>
        </View>
      </View>

      {/* Overall progress bar */}
      <View style={s.overallCard}>
        <View style={s.overallRow}>
          <Text style={s.overallLabel}>Today's health score</Text>
          <Text style={[s.overallPct, { color: GREEN }]}>{overallScore}%</Text>
        </View>
        <View style={s.overallTrack}>
          <View style={[s.overallFill, { width: `${overallScore}%` }]} />
        </View>
      </View>

      {/* Metric sliders */}
      <Text style={s.secLabel}>LOG YOUR DAY</Text>

      <MetricCard
        metric={METRICS[0]}
        value={sleep}
        onChange={setSleep}
        onSlidingComplete={v => save({ sleep: v })}
      />
      {/* Wrap in TouchableOpacity to capture slide complete via onSlidingComplete prop on Slider */}
      <MetricCard
        metric={METRICS[1]}
        value={water}
        onChange={setWater}
        onSlidingComplete={v => save({ water: v })}
      />
      <MetricCard
        metric={METRICS[2]}
        value={movement}
        onChange={setMovement}
        onSlidingComplete={v => save({ movement: v })}
      />

      {/* Manual save button (fallback) */}
      <TouchableOpacity
        style={s.saveBtn}
        onPress={() => save({ sleep, water, movement })}
      >
        <Text style={s.saveBtnTxt}>Save Today's Log</Text>
      </TouchableOpacity>

      {/* 7-day history */}
      <HistoryStrip entries={allEntries} />

    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: COLORS.bg },
  bgGlow:        { position: 'absolute', width: 280, height: 280, backgroundColor: 'rgba(96,165,250,0.06)', borderRadius: 140, top: -100, right: -60 },

  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: 16, paddingBottom: 10 },
  title:         { fontSize: 20, fontFamily: 'Orbitron', color: BLUE, letterSpacing: 1 },
  sub:           { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  scorePill:     { flexDirection: 'row', alignItems: 'baseline', backgroundColor: 'rgba(96,165,250,0.1)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(96,165,250,0.2)' },
  scoreNum:      { fontSize: 24, fontWeight: '900', color: BLUE },
  scorePct:      { fontSize: 12, color: BLUE, fontWeight: '700' },

  overallCard:   { marginHorizontal: 14, marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  overallRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  overallLabel:  { fontSize: 12, color: COLORS.textMuted },
  overallPct:    { fontSize: 14, fontWeight: '800' },
  overallTrack:  { height: 6, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 4, overflow: 'hidden' },
  overallFill:   { height: '100%', backgroundColor: GREEN, borderRadius: 4 },

  secLabel:      { paddingHorizontal: 18, paddingBottom: 8, paddingTop: 4, fontSize: 9, color: COLORS.textMuted, letterSpacing: 2, fontWeight: '700' },

  metricCard:    { marginHorizontal: 14, marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.025)', borderRadius: 20, padding: 16, borderWidth: 1, overflow: 'hidden' },
  accentLine:    { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  metricHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  metricLabel:   { fontSize: 14, fontWeight: '700', color: '#e8e8f0' },
  valuePill:     { flexDirection: 'row', alignItems: 'baseline', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  valueNum:      { fontSize: 18, fontWeight: '900' },
  valueUnit:     { fontSize: 10, fontWeight: '600' },
  slider:        { width: '100%', height: 40 },
  metricFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  metricTip:     { fontSize: 10, color: '#44445a' },
  goalBadge:     { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  goalBadgeTxt:  { fontSize: 9, fontWeight: '700' },
  miniTrack:     { height: 3, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 2, overflow: 'hidden' },
  miniFill:      { height: '100%', borderRadius: 2 },

  saveBtn:       { marginHorizontal: 14, marginBottom: 16, backgroundColor: BLUE, borderRadius: 14, padding: 16, alignItems: 'center' },
  saveBtnTxt:    { color: '#000', fontWeight: '900', fontSize: 13, letterSpacing: 0.8 },

  historyCard:   { marginHorizontal: 14, marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.025)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  historyRow:    { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, marginBottom: 10 },
  historyDay:    { alignItems: 'center', flex: 1 },
  historyLbl:    { fontSize: 9, color: '#44445a', marginBottom: 6 },
  barStack:      { flexDirection: 'row', gap: 2, height: 60, alignItems: 'flex-end' },
  barTrack:      { width: 6, height: 60, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill:       { width: '100%', borderRadius: 3 },
  legendRow:     { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  legendItem:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:     { width: 7, height: 7, borderRadius: 4 },
  legendTxt:     { fontSize: 9, color: '#44445a' },
});