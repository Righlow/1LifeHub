// ─────────────────────────────────────────────────────────────
// screens/BonsaiGrowthModel.js  —  1Life Hub
// SVG-based bonsai that grows with XP and blooms per domain
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import Svg, { Path, Circle, Ellipse, G, Line } from 'react-native-svg';

const { width } = Dimensions.get('window');
const W = width - 28;
const H = 220;

const DOMAIN_COLORS = {
  physical:  '#00FF87',
  mental:    '#60a5fa',
  financial: '#fbbf24',
  spiritual: '#c084fc',
  emotional: '#f87171',
  personal:  '#34d399',
};

const BLOOM_POSITIONS = [
  { x: W * 0.5,  y: H * 0.18 },  // top centre
  { x: W * 0.3,  y: H * 0.28 },  // upper left
  { x: W * 0.7,  y: H * 0.28 },  // upper right
  { x: W * 0.22, y: H * 0.42 },  // mid left
  { x: W * 0.78, y: H * 0.42 },  // mid right
  { x: W * 0.38, y: H * 0.52 },  // lower left
];

export default function BonsaiGrowthModel({ totalXP = 0, bloomedDomains = [], maxXP = 500 }) {
  const growthPct  = Math.min(totalXP / maxXP, 1);
  const trunkH     = 60 + growthPct * 60;       // 60–120px
  const canopyR    = 30 + growthPct * 50;       // 30–80 radius
  const branchSpan = 40 + growthPct * 60;

  // Animated glow pulse
  const glow = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1,   duration: 2000, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.5, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const cx = W / 2;
  const groundY = H - 30;
  const trunkTopY = groundY - trunkH;

  // Level label
  let levelLabel = 'SEED';
  if (growthPct >= 0.8) levelLabel = 'ANCIENT';
  else if (growthPct >= 0.6) levelLabel = 'THRIVING';
  else if (growthPct >= 0.4) levelLabel = 'GROWING';
  else if (growthPct >= 0.2) levelLabel = 'SPROUT';
  else if (growthPct > 0)    levelLabel = 'SEEDLING';

  return (
    <View style={s.container}>
      <Svg width={W} height={H}>
        {/* Ground */}
        <Ellipse cx={cx} cy={groundY + 8} rx={60} ry={8} fill="rgba(0,255,135,0.08)" />

        {/* Trunk */}
        <Path
          d={`M${cx - 8},${groundY} C${cx - 6},${trunkTopY + 30} ${cx + 4},${trunkTopY + 20} ${cx},${trunkTopY}`}
          stroke="#5a3a1a"
          strokeWidth={growthPct > 0.3 ? 14 : 10}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M${cx - 8},${groundY} C${cx - 6},${trunkTopY + 30} ${cx + 4},${trunkTopY + 20} ${cx},${trunkTopY}`}
          stroke="#7a5a2a"
          strokeWidth={growthPct > 0.3 ? 7 : 5}
          fill="none"
          strokeLinecap="round"
          opacity={0.5}
        />

        {/* Left branch */}
        {growthPct > 0.15 && (
          <Path
            d={`M${cx},${trunkTopY + 20} C${cx - branchSpan * 0.5},${trunkTopY + 10} ${cx - branchSpan},${trunkTopY - 5} ${cx - branchSpan},${trunkTopY - 15}`}
            stroke="#5a3a1a" strokeWidth={6} fill="none" strokeLinecap="round"
          />
        )}

        {/* Right branch */}
        {growthPct > 0.15 && (
          <Path
            d={`M${cx},${trunkTopY + 15} C${cx + branchSpan * 0.5},${trunkTopY + 5} ${cx + branchSpan},${trunkTopY - 10} ${cx + branchSpan},${trunkTopY - 20}`}
            stroke="#5a3a1a" strokeWidth={6} fill="none" strokeLinecap="round"
          />
        )}

        {/* Small sub-branches */}
        {growthPct > 0.4 && (
          <>
            <Path
              d={`M${cx - branchSpan * 0.5},${trunkTopY + 8} C${cx - branchSpan * 0.7},${trunkTopY - 5} ${cx - branchSpan * 0.9},${trunkTopY - 18} ${cx - branchSpan},${trunkTopY - 28}`}
              stroke="#5a3a1a" strokeWidth={4} fill="none" strokeLinecap="round"
            />
            <Path
              d={`M${cx + branchSpan * 0.5},${trunkTopY + 4} C${cx + branchSpan * 0.7},${trunkTopY - 8} ${cx + branchSpan * 0.85},${trunkTopY - 22} ${cx + branchSpan},${trunkTopY - 32}`}
              stroke="#5a3a1a" strokeWidth={4} fill="none" strokeLinecap="round"
            />
          </>
        )}

        {/* Canopy layers */}
        {growthPct > 0.05 && (
          <>
            {/* Outer shadow canopy */}
            <Ellipse cx={cx} cy={trunkTopY} rx={canopyR + 6} ry={canopyR * 0.65 + 4} fill="rgba(0,120,60,0.18)" />
            {/* Main canopy */}
            <Ellipse cx={cx} cy={trunkTopY} rx={canopyR} ry={canopyR * 0.65} fill={`rgba(0,180,80,${0.15 + growthPct * 0.25})`} />
            {/* Highlight */}
            <Ellipse cx={cx - canopyR * 0.2} cy={trunkTopY - canopyR * 0.15} rx={canopyR * 0.4} ry={canopyR * 0.25} fill="rgba(0,255,135,0.08)" />

            {/* Left canopy bubble */}
            <Ellipse cx={cx - canopyR * 0.7} cy={trunkTopY + canopyR * 0.1} rx={canopyR * 0.55} ry={canopyR * 0.45} fill={`rgba(0,160,70,${0.12 + growthPct * 0.2})`} />
            {/* Right canopy bubble */}
            <Ellipse cx={cx + canopyR * 0.7} cy={trunkTopY + canopyR * 0.05} rx={canopyR * 0.55} ry={canopyR * 0.45} fill={`rgba(0,160,70,${0.12 + growthPct * 0.2})`} />
          </>
        )}

        {/* Domain blooms */}
        {bloomedDomains.map((domain, i) => {
          const pos   = BLOOM_POSITIONS[i % BLOOM_POSITIONS.length];
          const color = DOMAIN_COLORS[domain] || '#00FF87';
          return (
            <G key={domain}>
              {/* Glow ring */}
              <Circle cx={pos.x} cy={pos.y} r={12} fill={`${color}22`} />
              {/* Bloom */}
              <Circle cx={pos.x} cy={pos.y} r={7}  fill={color} opacity={0.9} />
              {/* Shine */}
              <Circle cx={pos.x - 2} cy={pos.y - 2} r={2} fill="rgba(255,255,255,0.6)" />
            </G>
          );
        })}

        {/* Floating XP particles when growing */}
        {growthPct > 0.1 && [0,1,2].map(i => (
          <Circle
            key={`p${i}`}
            cx={cx + (i - 1) * 25 + Math.sin(i) * 10}
            cy={trunkTopY - canopyR * 0.3 - i * 12}
            r={2}
            fill="rgba(0,255,135,0.4)"
          />
        ))}
      </Svg>

      {/* Level badge */}
      <View style={s.levelBadge}>
        <Text style={s.levelTxt}>{levelLabel}</Text>
        <Text style={s.xpTxt}>{totalXP} / {maxXP} XP</Text>
      </View>

      {/* Domain legend */}
      {bloomedDomains.length > 0 && (
        <View style={s.legend}>
          {bloomedDomains.map(d => (
            <View key={d} style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: DOMAIN_COLORS[d] }]} />
              <Text style={[s.legendTxt, { color: DOMAIN_COLORS[d] }]}>{d}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:   { marginHorizontal: 14, marginBottom: 10, borderRadius: 20, backgroundColor: 'rgba(0,255,135,0.03)', borderWidth: 1, borderColor: 'rgba(0,255,135,0.1)', overflow: 'hidden', alignItems: 'center', paddingTop: 10, paddingBottom: 12 },
  levelBadge:  { alignItems: 'center', marginTop: 4 },
  levelTxt:    { fontSize: 11, color: '#00FF87', fontWeight: '800', letterSpacing: 2 },
  xpTxt:       { fontSize: 9, color: '#44445a', marginTop: 2 },
  legend:      { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 10, paddingHorizontal: 10 },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot:   { width: 7, height: 7, borderRadius: 4 },
  legendTxt:   { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
});