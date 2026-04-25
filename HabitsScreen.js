// ─────────────────────────────────────────────────────────────
// screens/HabitsScreen.js  —  1Life Hub
// Flat list, animated checkbox, swipe-to-delete via long press
// ─────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  TextInput, StyleSheet, Alert, Modal, Animated,
} from 'react-native';
import { habitsStore } from '../store';
import { COLORS } from '../constants/colors';

const GREEN = COLORS.neon;

const DOMAINS = ['physical','mental','financial','spiritual','emotional','personal'];
const DOMAIN_COLORS = {
  physical: '#00FF87', mental: '#60a5fa', financial: '#fbbf24',
  spiritual: '#c084fc', emotional: '#f87171', personal: '#34d399',
};

// ── Single habit row ──────────────────────────────────────────
function HabitRow({ habit, onToggle, onDelete }) {
  const scale = useRef(new Animated.Value(1)).current;
  const color = DOMAIN_COLORS[habit.domain] || GREEN;
  const active = habit.is_active !== false;

  const handleToggle = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.9, useNativeDriver: true, speed: 50 }),
      Animated.spring(scale, { toValue: 1,   useNativeDriver: true, speed: 20 }),
    ]).start(() => onToggle(habit));
  };

  return (
    <Animated.View style={[s.habitCard, { borderLeftColor: color, transform: [{ scale }], opacity: active ? 1 : 0.45 }]}>
      <TouchableOpacity
        style={s.habitInner}
        onPress={handleToggle}
        onLongPress={() => onDelete(habit)}
        activeOpacity={0.75}
        delayLongPress={500}
      >
        {/* Domain colour dot */}
        <View style={[s.domainDot, { backgroundColor: color }]} />

        <View style={{ flex: 1 }}>
          <Text style={s.habitName}>{habit.name}</Text>
          <View style={s.habitMeta}>
            <Text style={[s.habitDomain, { color }]}>{habit.domain}</Text>
            <Text style={s.habitMetaDot}> · </Text>
            <Text style={[s.habitXP, { color }]}>+{habit.xp_value || 10} XP/day</Text>
          </View>
        </View>

        {/* Active / paused toggle */}
        <TouchableOpacity
          onPress={() => onToggle(habit)}
          style={[s.toggleBtn, active
            ? { backgroundColor: `${color}20`, borderColor: `${color}50` }
            : { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }
          ]}
        >
          <Text style={[s.toggleTxt, { color: active ? color : '#555' }]}>
            {active ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// HABITS SCREEN
// ─────────────────────────────────────────────────────────────
export default function HabitsScreen({ navigation }) {
  const [habits,  setHabits]  = useState([]);
  const [modal,   setModal]   = useState(false);
  const [name,    setName]    = useState('');
  const [domain,  setDomain]  = useState('physical');
  const [xpValue, setXpValue] = useState('10');

  const load = async () => {
    const h = await habitsStore.list();
    setHabits(Array.isArray(h) ? h : []);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation]);

  const create = async () => {
    if (!name.trim()) return;
    await habitsStore.create({
      name:      name.trim(),
      domain,
      xp_value:  Number(xpValue) || 10,
      is_active: true,
    });
    setName(''); setModal(false); load();
  };

  const toggle = async (habit) => {
    await habitsStore.update(habit.id, { is_active: !habit.is_active });
    load();
  };

  const deleteHabit = (habit) => {
    Alert.alert('Delete habit', `Delete "${habit.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => { await habitsStore.remove(habit.id); load(); },
      },
    ]);
  };

  const activeH   = habits.filter(h => h.is_active !== false);
  const inactiveH = habits.filter(h => h.is_active === false);
  const xpPerDay  = activeH.reduce((s, h) => s + (h.xp_value || 10), 0);

  // Sort: active alphabetically first, inactive at end
  const sorted = [
    ...activeH.sort((a, b) => a.name.localeCompare(b.name)),
    ...inactiveH.sort((a, b) => a.name.localeCompare(b.name)),
  ];

  return (
    <View style={s.container}>
      <View style={s.bgGlow} />

      {/* Stats bar */}
      <View style={s.statsBar}>
        <View style={s.statItem}>
          <Text style={s.statNum}>{activeH.length}</Text>
          <Text style={s.statLbl}>ACTIVE</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statNum}>{habits.length}</Text>
          <Text style={s.statLbl}>TOTAL</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statNum}>{xpPerDay}</Text>
          <Text style={s.statLbl}>XP/DAY</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setModal(true)}>
          <Text style={s.addBtnTxt}>+ ADD</Text>
        </TouchableOpacity>
      </View>

      {/* Hint */}
      {habits.length > 0 && (
        <Text style={s.hint}>Long press a habit to delete it</Text>
      )}

      {/* Flat list */}
      <FlatList
        data={sorted}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 40, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.emptyCard}>
            <Text style={s.emptyTitle}>No habits yet</Text>
            <Text style={s.emptyDesc}>Build your daily disciplines one habit at a time.</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => setModal(true)}>
              <Text style={s.emptyBtnTxt}>CREATE FIRST HABIT</Text>
            </TouchableOpacity>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
        renderItem={({ item }) => (
          <HabitRow
            habit={item}
            onToggle={toggle}
            onDelete={deleteHabit}
          />
        )}
      />

      {/* Create Modal */}
      <Modal visible={modal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>NEW HABIT</Text>

            <Text style={s.fieldLabel}>NAME</Text>
            <TextInput
              style={s.fieldInput}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Morning run, Read, Meditate..."
              placeholderTextColor="#44445a"
              autoFocus
            />

            <Text style={s.fieldLabel}>DOMAIN</Text>
            <View style={s.chipRow}>
              {DOMAINS.map(d => {
                const c      = DOMAIN_COLORS[d];
                const active = domain === d;
                return (
                  <TouchableOpacity
                    key={d}
                    style={[s.chip, active && { backgroundColor: c, borderColor: c }]}
                    onPress={() => setDomain(d)}
                  >
                    <Text style={[s.chipTxt, active && { color: '#000', fontWeight: '700' }]}>{d}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={s.fieldLabel}>XP VALUE PER DAY</Text>
            <TextInput
              style={s.fieldInput}
              value={xpValue}
              onChangeText={setXpValue}
              keyboardType="numeric"
              placeholderTextColor="#44445a"
            />

            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setModal(false)}>
                <Text style={s.cancelTxt}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.createBtn} onPress={create}>
                <Text style={s.createTxt}>CREATE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.bg },
  bgGlow:          { position: 'absolute', width: 280, height: 280, backgroundColor: 'rgba(0,255,135,0.05)', borderRadius: 140, top: -80, right: -80 },

  statsBar:        { flexDirection: 'row', alignItems: 'center', marginHorizontal: 14, marginTop: 14, marginBottom: 4, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  statItem:        { flex: 1, alignItems: 'center' },
  statNum:         { fontSize: 22, fontWeight: '900', color: GREEN },
  statLbl:         { fontSize: 8, color: '#44445a', letterSpacing: 1, marginTop: 2 },
  statDivider:     { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.07)' },
  addBtn:          { backgroundColor: GREEN, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, marginLeft: 10 },
  addBtnTxt:       { color: '#000', fontWeight: '900', fontSize: 12 },

  hint:            { paddingHorizontal: 18, paddingVertical: 6, fontSize: 9, color: '#44445a' },

  habitCard:       { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderLeftWidth: 3, overflow: 'hidden' },
  habitInner:      { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  domainDot:       { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  habitName:       { fontSize: 14, fontWeight: '600', color: '#e8e8f0', marginBottom: 3 },
  habitMeta:       { flexDirection: 'row', alignItems: 'center' },
  habitDomain:     { fontSize: 10, fontWeight: '700' },
  habitMetaDot:    { fontSize: 10, color: '#44445a' },
  habitXP:         { fontSize: 10, fontWeight: '700' },
  toggleBtn:       { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  toggleTxt:       { fontSize: 10, fontWeight: '800' },

  emptyCard:       { borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: 32, alignItems: 'center', marginTop: 20 },
  emptyTitle:      { fontSize: 18, fontWeight: '800', color: '#e8e8f0', marginBottom: 8 },
  emptyDesc:       { fontSize: 12, color: '#44445a', textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  emptyBtn:        { backgroundColor: GREEN, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  emptyBtnTxt:     { color: '#000', fontWeight: '900', fontSize: 12, letterSpacing: 0.8 },

  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet:      { backgroundColor: '#0e0e18', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalHandle:     { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle:      { fontSize: 14, fontWeight: '900', color: GREEN, letterSpacing: 2, marginBottom: 4 },
  fieldLabel:      { fontSize: 9, color: '#44445a', letterSpacing: 1.5, fontWeight: '700', marginBottom: 6, marginTop: 14 },
  fieldInput:      { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, color: '#e8e8f0', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', fontSize: 14 },
  chipRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip:            { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)' },
  chipTxt:         { color: '#8888a0', fontSize: 12 },
  modalBtns:       { flexDirection: 'row', gap: 10, marginTop: 24 },
  cancelBtn:       { flex: 1, borderRadius: 14, padding: 16, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  cancelTxt:       { color: '#8888a0', fontWeight: '700', fontSize: 13 },
  createBtn:       { flex: 2, borderRadius: 14, padding: 16, alignItems: 'center', backgroundColor: GREEN },
  createTxt:       { color: '#000', fontWeight: '900', fontSize: 13 },
});