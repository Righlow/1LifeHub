// ─────────────────────────────────────────────────────────────
// screens/OnboardingScreen.js  —  1Life Hub
// 4 slides, plant grows across each step, stored in AsyncStorage
// ─────────────────────────────────────────────────────────────
import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle, Ellipse, G } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const GREEN  = '#00FF87';
const PURPLE = '#c084fc';
const BLUE   = '#60a5fa';
const AMBER  = '#fbbf24';

// ── Slides config ─────────────────────────────────────────────
const SLIDES = [
  {
    id:      0,
    title:   'Welcome to\n1Life Hub',
    sub:     'Your personal growth tracker.\nBuilt around your life.',
    accent:  GREEN,
    tip:     null,
    plantXP: 0,      // seed
  },
  {
    id:      1,
    title:   'Build Daily\nHabits',
    sub:     'Log your habits every day.\nEach one feeds your plant.',
    accent:  GREEN,
    tip:     '🌿  Habit → XP → Growth',
    plantXP: 150,    // sprouting
  },
  {
    id:      2,
    title:   'Track Your\nHealth & Goals',
    sub:     'Log sleep, water and movement.\nSet weekly, monthly and yearly goals.',
    accent:  BLUE,
    tip:     '💧  Sleep · Water · Movement',
    plantXP: 350,    // growing
  },
  {
    id:      3,
    title:   'Watch\nYourself Grow',
    sub:     'Your plant reflects your progress\nacross every area of your life.',
    accent:  PURPLE,
    tip:     null,
    plantXP: 500,    // fully bloomed
  },
];

// ── Mini plant SVG that grows with XP ────────────────────────
function PlantStage({ xp, accent }) {
  const W = width * 0.7;
  const H = 220;
  const pct       = Math.min(xp / 500, 1);
  const cx        = W / 2;
  const groundY   = H - 20;
  const trunkH    = 40 + pct * 80;
  const trunkTopY = groundY - trunkH;
  const canopyR   = 20 + pct * 55;
  const branchSpan= 30 + pct * 55;

  const bloomDomains = xp >= 150
    ? xp >= 350
      ? ['physical', 'mental', 'financial', 'spiritual']
      : ['physical', 'mental']
    : [];

  const BLOOM_COLORS = {
    physical: GREEN, mental: BLUE, financial: AMBER, spiritual: PURPLE,
  };
  const BLOOM_POS = [
    { x: W * 0.5, y: H * 0.2  },
    { x: W * 0.3, y: H * 0.3  },
    { x: W * 0.7, y: H * 0.3  },
    { x: W * 0.22,y: H * 0.44 },
  ];

  return (
    <Svg width={W} height={H}>
      {/* Ground */}
      <Ellipse cx={cx} cy={groundY + 6} rx={50} ry={7}
        fill={`${GREEN}15`} />

      {/* Trunk */}
      {pct > 0 && (
        <Path
          d={`M${cx - 6},${groundY} C${cx - 4},${trunkTopY + 25} ${cx + 3},${trunkTopY + 15} ${cx},${trunkTopY}`}
          stroke="#5a3a1a" strokeWidth={pct > 0.3 ? 12 : 8}
          fill="none" strokeLinecap="round"
        />
      )}

      {/* Left branch */}
      {pct > 0.2 && (
        <Path
          d={`M${cx},${trunkTopY + 18} C${cx - branchSpan * 0.5},${trunkTopY + 8} ${cx - branchSpan},${trunkTopY - 5} ${cx - branchSpan},${trunkTopY - 14}`}
          stroke="#5a3a1a" strokeWidth={5} fill="none" strokeLinecap="round"
        />
      )}

      {/* Right branch */}
      {pct > 0.2 && (
        <Path
          d={`M${cx},${trunkTopY + 13} C${cx + branchSpan * 0.5},${trunkTopY + 4} ${cx + branchSpan},${trunkTopY - 9} ${cx + branchSpan},${trunkTopY - 18}`}
          stroke="#5a3a1a" strokeWidth={5} fill="none" strokeLinecap="round"
        />
      )}

      {/* Canopy */}
      {pct > 0.05 && (
        <>
          <Ellipse cx={cx} cy={trunkTopY} rx={canopyR + 5} ry={canopyR * 0.65 + 3}
            fill={`rgba(0,120,60,0.18)`} />
          <Ellipse cx={cx} cy={trunkTopY} rx={canopyR} ry={canopyR * 0.65}
            fill={`rgba(0,180,80,${0.15 + pct * 0.25})`} />
          <Ellipse cx={cx - canopyR * 0.7} cy={trunkTopY + canopyR * 0.1}
            rx={canopyR * 0.5} ry={canopyR * 0.42}
            fill={`rgba(0,160,70,${0.12 + pct * 0.2})`} />
          <Ellipse cx={cx + canopyR * 0.7} cy={trunkTopY + canopyR * 0.05}
            rx={canopyR * 0.5} ry={canopyR * 0.42}
            fill={`rgba(0,160,70,${0.12 + pct * 0.2})`} />
        </>
      )}

      {/* Seed (pct === 0) */}
      {pct === 0 && (
        <>
          <Ellipse cx={cx} cy={groundY - 8} rx={10} ry={14}
            fill="#5a3a1a" />
          <Path d={`M${cx},${groundY - 22} C${cx - 6},${groundY - 34} ${cx + 6},${groundY - 34} ${cx},${groundY - 22}`}
            stroke={GREEN} strokeWidth={2} fill="none" strokeLinecap="round" />
        </>
      )}

      {/* Domain blooms */}
      {bloomDomains.map((d, i) => {
        const pos   = BLOOM_POS[i];
        const color = BLOOM_COLORS[d];
        return (
          <G key={d}>
            <Circle cx={pos.x} cy={pos.y} r={11} fill={`${color}22`} />
            <Circle cx={pos.x} cy={pos.y} r={6.5} fill={color} opacity={0.9} />
            <Circle cx={pos.x - 2} cy={pos.y - 2} r={1.8}
              fill="rgba(255,255,255,0.6)" />
          </G>
        );
      })}
    </Svg>
  );
}

// ── Floating particle (animated dot) ─────────────────────────
function Particle({ color, delay, startX, startY }) {
  const y   = useRef(new Animated.Value(0)).current;
  const op  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(y,  { toValue: -40, duration: 2200, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(op, { toValue: 0.7, duration: 600, useNativeDriver: true }),
            Animated.timing(op, { toValue: 0,   duration: 1600, useNativeDriver: true }),
          ]),
        ]),
        Animated.parallel([
          Animated.timing(y,  { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(op, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute',
      left: startX,
      top:  startY,
      width: 5, height: 5, borderRadius: 3,
      backgroundColor: color,
      opacity: op,
      transform: [{ translateY: y }],
    }} />
  );
}

// ─────────────────────────────────────────────────────────────
// ONBOARDING SCREEN
// ─────────────────────────────────────────────────────────────
export default function OnboardingScreen({ onDone }) {
  const [current, setCurrent] = useState(0);

  // Animated values per slide
  const fadeTitle  = useRef(new Animated.Value(0)).current;
  const slidePlant = useRef(new Animated.Value(0)).current;
  const scaleBtn   = useRef(new Animated.Value(1)).current;
  const plantScale = useRef(new Animated.Value(0.7)).current;

  // Animate in when slide changes
  useEffect(() => {
    fadeTitle.setValue(0);
    plantScale.setValue(0.7);

    Animated.parallel([
      Animated.timing(fadeTitle, {
        toValue: 1, duration: 500, useNativeDriver: true,
      }),
      Animated.spring(plantScale, {
        toValue: 1, friction: 5, tension: 40, useNativeDriver: true,
      }),
    ]).start();
  }, [current]);

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  const next = () => {
    if (isLast) {
      handleDone();
    } else {
      // Fade out then move to next
      Animated.timing(fadeTitle, {
        toValue: 0, duration: 200, useNativeDriver: true,
      }).start(() => setCurrent(c => c + 1));
    }
  };

  const handleDone = async () => {
    // Save and navigate immediately — don't wait for animation callback
    await AsyncStorage.setItem('onboarding_done', 'true');
    if (typeof onDone === 'function') {
      onDone();
    }
    // Animation runs in parallel
    Animated.sequence([
      Animated.spring(scaleBtn, { toValue: 0.92, useNativeDriver: true }),
      Animated.spring(scaleBtn, { toValue: 1,    useNativeDriver: true }),
    ]).start();
  };

  // Particles — only show when plant has grown (slide 1+)
  const particles = [
    { color: GREEN,  delay: 0,    startX: width * 0.2, startY: height * 0.38 },
    { color: BLUE,   delay: 700,  startX: width * 0.6, startY: height * 0.32 },
    { color: AMBER,  delay: 1400, startX: width * 0.75,startY: height * 0.42 },
    { color: PURPLE, delay: 400,  startX: width * 0.25,startY: height * 0.45 },
    { color: GREEN,  delay: 1100, startX: width * 0.5, startY: height * 0.28 },
  ];

  return (
    <SafeAreaView style={s.container}>

      {/* Background glow that matches accent */}
      <Animated.View style={[s.bgGlow, { backgroundColor: `${slide.accent}12` }]} />

      {/* Floating particles (visible from slide 1 onwards) */}
      {current > 0 && particles.map((p, i) => (
        <Particle key={i} {...p} />
      ))}

      {/* Progress dots */}
      <View style={s.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[
            s.dot,
            i === current && { backgroundColor: slide.accent, width: 20 },
            i < current   && { backgroundColor: `${slide.accent}60` },
          ]} />
        ))}
      </View>

      {/* Plant — grows each slide */}
      <Animated.View style={[s.plantWrap, { transform: [{ scale: plantScale }] }]}>
        <PlantStage xp={slide.plantXP} accent={slide.accent} />

        {/* Stage label */}
        <View style={[s.stagePill, { borderColor: `${slide.accent}40`, backgroundColor: `${slide.accent}12` }]}>
          <Text style={[s.stageTxt, { color: slide.accent }]}>
            {slide.plantXP === 0   ? 'SEED'     :
             slide.plantXP < 200   ? 'SEEDLING' :
             slide.plantXP < 450   ? 'GROWING'  : 'BLOOMED'}
          </Text>
        </View>
      </Animated.View>

      {/* Text content */}
      <Animated.View style={[s.textWrap, { opacity: fadeTitle }]}>
        <Text style={[s.title, { color: slide.accent }]}>{slide.title}</Text>
        <Text style={s.sub}>{slide.sub}</Text>

        {slide.tip && (
          <View style={[s.tipPill, { backgroundColor: `${slide.accent}14`, borderColor: `${slide.accent}30` }]}>
            <Text style={[s.tipTxt, { color: slide.accent }]}>{slide.tip}</Text>
          </View>
        )}
      </Animated.View>

      {/* Button */}
      <Animated.View style={[s.btnWrap, { transform: [{ scale: scaleBtn }] }]}>
        <TouchableOpacity
          style={[s.btn, { backgroundColor: slide.accent }]}
          onPress={next}
          activeOpacity={0.85}
        >
          <Text style={s.btnTxt}>
            {isLast ? 'GET STARTED  🌱' : 'NEXT  →'}
          </Text>
        </TouchableOpacity>

        {/* Skip — only on non-last slides */}
        {!isLast && (
          <TouchableOpacity onPress={handleDone} style={s.skipBtn}>
            <Text style={s.skipTxt}>Skip</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#050507', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20 },
  bgGlow:     { position: 'absolute', width: 340, height: 340, borderRadius: 170, top: height * 0.15, alignSelf: 'center' },

  dots:       { flexDirection: 'row', gap: 6, marginTop: 16, alignSelf: 'center' },
  dot:        { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.15)', transition: 'width 0.3s' },

  plantWrap:  { alignItems: 'center', marginTop: 10 },
  stagePill:  { marginTop: 8, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  stageTxt:   { fontSize: 10, fontWeight: '800', letterSpacing: 2 },

  textWrap:   { alignItems: 'center', paddingHorizontal: 32, gap: 10 },
  title:      { fontSize: 32, fontWeight: '900', textAlign: 'center', lineHeight: 38, fontFamily: 'Orbitron' },
  sub:        { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 22 },
  tipPill:    { marginTop: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  tipTxt:     { fontSize: 12, fontWeight: '700' },

  btnWrap:    { width: '100%', paddingHorizontal: 28, alignItems: 'center', gap: 12 },
  btn:        { width: '100%', borderRadius: 18, paddingVertical: 18, alignItems: 'center',
                shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  btnTxt:     { color: '#000', fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  skipBtn:    { paddingVertical: 6 },
  skipTxt:    { fontSize: 12, color: 'rgba(255,255,255,0.25)', fontWeight: '500' },
});