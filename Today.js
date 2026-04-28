// Screens/Today.js  —  1Life Hub
// Plant + today's habits + health snapshot + weekly goal avg
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  RefreshControl,
  FlatList,
} from "react-native";
import { BlurView } from "expo-blur";
import { habitsStore, entriesStore, goalsStore, healthStore } from "../store";
import BonsaiGrowthModel from "./BonsaiGrowthModel";
import { COLORS } from "../constants/colors";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const GREEN = COLORS.neon;
const BLUE = "#60a5fa";
const AMBER = "#fbbf24";

const DOMAIN_COLORS = {
  physical: "#00FF87",
  mental: "#60a5fa",
  financial: "#fbbf24",
  spiritual: "#c084fc",
  emotional: "#f87171",
  personal: "#34d399",
};

// Glass Card
function GlassCard({ children, style, accentColor, onPress }) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.85}
      style={{ marginHorizontal: 14, marginBottom: 10 }}
    >
      <BlurView intensity={40} tint="dark" style={[s.glassCard, style]}>
        <View style={s.glassShine} pointerEvents="none" />
        {accentColor && (
          <View style={[s.accentLine, { backgroundColor: accentColor }]} />
        )}
        {children}
      </BlurView>
    </Wrapper>
  );
}

// ── Streak pill with count and label ─────────────────────────
function StreakPill({ count }) {
  return (
    <View style={s.streakPill}>
      <Text style={s.streakNum}>{count}</Text>
      <Text style={s.streakLbl}> day streak</Text>
    </View>
  );
}

// ── Habit row with animated checkbox ─────────────────────────
function HabitRow({ habit, completed, onToggle }) {
  const scale = useRef(new Animated.Value(1)).current;
  const color = DOMAIN_COLORS[habit.domain] || GREEN;

  const handleToggle = () => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 0.85,
        useNativeDriver: true,
        speed: 50,
      }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
    onToggle(habit.id);
  };

  return (
    <SafeAreaView>
      <Animated.View style={[s.habitRow, { transform: [{ scale }] }]}>
        <TouchableOpacity
          onPress={handleToggle}
          style={s.habitTouchable}
          activeOpacity={0.7}
        >
          <View
            style={[
              s.checkbox,
              completed && { backgroundColor: color, borderColor: color },
            ]}
          >
            {completed && <Text style={s.checkTick}>✓</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.habitName, completed && s.habitDone]}>
              {habit.name}
            </Text>
            <Text style={[s.habitXP, { color }]}>
              +{habit.xp_value || 10} XP
            </Text>
          </View>
          <View style={[s.domainDot, { backgroundColor: color }]} />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

// ── Health snapshot strip ─────────────────────────────────────
function HealthSnapshot({ health, onPress }) {
  const metrics = [
    {
      label: "Sleep",
      value: health?.sleep || 0,
      unit: "hrs",
      color: BLUE,
      max: 8,
    },
    {
      label: "Water",
      value: health?.water || 0,
      unit: "gl",
      color: GREEN,
      max: 8,
    },
    {
      label: "Move",
      value: health?.movement || 0,
      unit: "min",
      color: AMBER,
      max: 60,
    },
  ];

  return (
    <GlassCard onPress={onPress} style={s.healthCard}>
      <Text style={s.cardTitle}>Physical Health</Text>
      <View style={s.healthRow}>
        {metrics.map((m) => (
          <View key={m.label} style={s.healthMetric}>
            <Text style={[s.healthVal, { color: m.color }]}>
              {m.value % 1 === 0 ? m.value : m.value.toFixed(1)}
            </Text>
            <Text style={s.healthUnit}>{m.unit}</Text>
            <Text style={s.healthLabel}>{m.label}</Text>
            <View style={s.healthTrack}>
              <View
                style={[
                  s.healthFill,
                  {
                    width: `${Math.min((m.value / m.max) * 100, 100)}%`,
                    backgroundColor: m.color,
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
      <Text style={s.healthTap}>Tap to log →</Text>
    </GlassCard>
  );
}

// ── Weekly goal bar ───────────────────────────────────────────
function WeeklyGoalBar({ goals, onPress }) {
  const weekly = goals.filter(
    (g) => g.timeframe === "weekly" && (g.status === "active" || !g.status),
  );
  const avg = weekly.length
    ? Math.round(
        weekly.reduce((s, g) => s + (g.progress || 0), 0) / weekly.length,
      )
    : 0;

  return (
    <GlassCard onPress={onPress} style={s.goalCard}>
      <View style={s.goalCardRow}>
        <Text style={s.cardTitle}>This week's goals</Text>
        <Text style={[s.goalAvgPct, { color: GREEN }]}>{avg}%</Text>
      </View>
      <View style={s.goalTrack}>
        <View style={[s.goalFill, { width: `${avg}%` }]} />
      </View>
      <Text style={s.goalSub}>
        {weekly.length} active weekly goal{weekly.length !== 1 ? "s" : ""} · Tap
        to manage
      </Text>
    </GlassCard>
  );
}

// ─────────────────────────────────────────────────────────────
// TODAY SCREEN
// ─────────────────────────────────────────────────────────────
export default function TodayScreen({ navigation }) {
  const [habits, setHabits] = useState([]);
  const [entries, setEntries] = useState([]);
  const [goals, setGoals] = useState([]);
  const [health, setHealth] = useState(null);
  const [completions, setCompletions] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  const load = useCallback(async () => {
    const [h, e, g, todayHealth] = await Promise.all([
      habitsStore.list(),
      entriesStore.list(),
      goalsStore.list(),
      healthStore.getToday(),
    ]);
    const activeHabits = (Array.isArray(h) ? h : []).filter(
      (x) => x.is_active !== false,
    );
    setHabits(activeHabits);
    setEntries(Array.isArray(e) ? e : []);
    setGoals(Array.isArray(g) ? g : []);
    setHealth(todayHealth);

    // Load today's completions from entries
    const todayEntry = (Array.isArray(e) ? e : []).find(
      (x) => x.date === todayStr,
    );
    if (todayEntry?.habit_completions) {
      const comp = {};
      todayEntry.habit_completions.forEach((c) => {
        comp[c.habit_id] = c.completed;
      });
      setCompletions(comp);
    }
  }, [todayStr]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Toggle habit and auto-save entry
  const toggleHabit = async (habitId) => {
    const next = { ...completions, [habitId]: !completions[habitId] };
    setCompletions(next);

    // Build entry data
    const habit_completions = habits.map((h) => ({
      habit_id: h.id,
      completed: !!next[h.id],
      domain: h.domain,
      xp_value: h.xp_value || 10,
    }));
    const total_xp_earned = habit_completions
      .filter((c) => c.completed)
      .reduce((s, c) => s + c.xp_value, 0);
    const domain_xp = {};
    habit_completions
      .filter((c) => c.completed && c.domain)
      .forEach((c) => {
        domain_xp[c.domain] = (domain_xp[c.domain] || 0) + c.xp_value;
      });

    const data = {
      date: todayStr,
      habit_completions,
      domain_xp,
      total_xp_earned,
    };
    const existing = entries.find((e) => e.date === todayStr);
    if (existing) {
      await entriesStore.update(existing.id, data);
    } else {
      const created = await entriesStore.create(data);
      setEntries((prev) => [...prev, created]);
    }
  };

  // Derived values
  const activeHabits = habits;
  const completedCount = activeHabits.filter((h) => !!completions[h.id]).length;
  const habitScore = activeHabits.length
    ? completedCount / activeHabits.length
    : 0;
  const healthScore = health
    ? (Math.min((health.sleep || 0) / 8, 1) +
        Math.min((health.water || 0) / 8, 1) +
        Math.min((health.movement || 0) / 60, 1)) /
      3
    : 0;
  const weeklyGoals = goals.filter(
    (g) => g.timeframe === "weekly" && (g.status === "active" || !g.status),
  );
  const goalScore = weeklyGoals.length
    ? weeklyGoals.reduce((s, g) => s + (g.progress || 0), 0) /
      weeklyGoals.length /
      100
    : 0;
  const combinedScore = (habitScore + healthScore + goalScore) / 3;
  const plantXP = Math.round(combinedScore * 500);

  // Streak count
  const streakCount = (() => {
    let count = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const hit = entries.some(
        (e) =>
          e.date === key &&
          Array.isArray(e.habit_completions) &&
          e.habit_completions.some((c) => c.completed),
      );
      if (hit) count++;
      else if (i > 0) break;
    }
    return count;
  })();

  const bloomedDomains = [
    ...new Set(
      activeHabits
        .filter((h) => completions[h.id] && h.domain)
        .map((h) => h.domain),
    ),
  ];

  return (
    <SafeAreaView style={s.container}>
      <ScrollView
        style={s.container}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={GREEN}
          />
        }
      >
        {/* Background glow */}
        <View style={s.bgGlow} />

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.title}>1LIFE HUB</Text>
            <Text style={s.sub}>
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long",
                day: "2-digit",
                month: "short",
              })}
            </Text>
          </View>
          <StreakPill count={streakCount} />
        </View>

        {/* Plant */}
        <BonsaiGrowthModel
          totalXP={plantXP}
          bloomedDomains={bloomedDomains}
          maxXP={500}
        />

        {/* Today's Habits */}
        <View style={s.sectionHeader}>
          <Text style={s.secLabel}>TODAY'S HABITS</Text>
          <Text style={s.secCount}>
            {completedCount} / {activeHabits.length}
          </Text>
        </View>

        {activeHabits.length === 0 ? (
          <GlassCard
            onPress={() => navigation.navigate("Habits")}
            style={s.emptyCard}
          >
            <Text style={s.emptyTxt}>
              No habits yet — tap to add your first
            </Text>
          </GlassCard>
        ) : (
          <GlassCard style={s.habitsCard}>
            {activeHabits.map((h, i) => (
              <View key={h.id}>
                <HabitRow
                  habit={h}
                  completed={!!completions[h.id]}
                  onToggle={toggleHabit}
                />
                {i < activeHabits.length - 1 && <View style={s.divider} />}
              </View>
            ))}
          </GlassCard>
        )}

        {/* Health snapshot */}
        <Text style={s.secLabel}>PHYSICAL HEALTH</Text>
        <HealthSnapshot
          health={health}
          onPress={() => navigation.navigate("Physical")}
        />

        {/* Weekly goals */}
        <Text style={s.secLabel}>WEEKLY GOALS</Text>
        <WeeklyGoalBar
          goals={goals}
          onPress={() => navigation.navigate("Goals")}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  bgGlow: {
    position: "absolute",
    width: 300,
    height: 300,
    backgroundColor: COLORS.neonSoft,
    borderRadius: 150,
    top: -120,
    right: -80,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontFamily: "Orbitron",
    color: GREEN,
    letterSpacing: 1,
  },
  sub: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },

  streakPill: {
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: "rgba(0,255,135,0.08)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(0,255,135,0.18)",
  },
  streakNum: { fontSize: 18, fontWeight: "900", color: GREEN },
  streakLbl: { fontSize: 10, color: GREEN, opacity: 0.7 },

  glassCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    padding: 16,
  },
  glassShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "40%",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  accentLine: { position: "absolute", top: 0, left: 0, right: 0, height: 2 },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 6,
  },
  secLabel: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 6,
    fontSize: 9,
    color: COLORS.textMuted,
    letterSpacing: 2,
    fontWeight: "700",
  },
  secCount: { fontSize: 11, color: GREEN, fontWeight: "700", paddingRight: 18 },

  habitsCard: { padding: 6 },
  emptyCard: { padding: 20, alignItems: "center" },
  emptyTxt: { fontSize: 12, color: COLORS.textMuted, textAlign: "center" },

  habitTouchable: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    gap: 12,
  },
  habitRow: { borderRadius: 12 },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkTick: { color: "#000", fontWeight: "900", fontSize: 13 },
  habitName: { fontSize: 14, fontWeight: "600", color: "#e8e8f0" },
  habitDone: { textDecorationLine: "line-through", opacity: 0.45 },
  habitXP: { fontSize: 10, fontWeight: "700", marginTop: 2 },
  domainDot: { width: 8, height: 8, borderRadius: 4 },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    marginHorizontal: 10,
  },

  healthCard: { padding: 14 },
  cardTitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 12,
  },
  healthRow: { flexDirection: "row", justifyContent: "space-around" },
  healthMetric: { alignItems: "center", flex: 1 },
  healthVal: { fontSize: 20, fontWeight: "900" },
  healthUnit: { fontSize: 9, color: COLORS.textMuted, marginBottom: 2 },
  healthLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  healthTrack: {
    width: 40,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 2,
    overflow: "hidden",
  },
  healthFill: { height: "100%", borderRadius: 2 },
  healthTap: {
    fontSize: 9,
    color: COLORS.textMuted,
    textAlign: "right",
    marginTop: 8,
  },

  goalCard: { padding: 14 },
  goalCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  goalAvgPct: { fontSize: 20, fontWeight: "900" },
  goalTrack: {
    height: 6,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  goalFill: { height: "100%", backgroundColor: GREEN, borderRadius: 4 },
  goalSub: { fontSize: 10, color: COLORS.textMuted },
});
