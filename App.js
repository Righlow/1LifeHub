// ─────────────────────────────────────────────────────────────
// App.js  —  1Life Hub
// ─────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';

import TodayScreen      from './screens/Today';
import HabitsScreen     from './screens/HabitsScreen';
import GoalsScreen      from './screens/GoalsScreen';
import PhysicalScreen   from './screens/Physical';
import OnboardingScreen from './screens/OnboardingScreen';

const Tab   = createBottomTabNavigator();
const GREEN = '#00FF87';
const BLUE  = '#60a5fa';

function TabIcon({ name, focused, color }) {
  const icons = { Today: '⌂', Habits: '◈', Goals: '◎', Physical: '♡' };
  return (
    <View style={[tabS.iconWrap, focused && { backgroundColor: `${color}18` }]}>
      <Text style={[tabS.iconTxt, { color }]}>{icons[name]}</Text>
    </View>
  );
}

const tabS = StyleSheet.create({
  iconWrap: { width: 36, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iconTxt:  { fontSize: 16 },
});

function MainApp() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#08080f',
            borderTopColor: 'rgba(255,255,255,0.06)',
            borderTopWidth: 1,
            height: 70,
            paddingBottom: 10,
            paddingTop: 6,
          },
          tabBarActiveTintColor: (() => {
            if (route.name === 'Physical') return BLUE;
            if (route.name === 'Goals')    return '#c084fc';
            return GREEN;
          })(),
          tabBarInactiveTintColor: '#44445a',
          tabBarLabelStyle: {
            fontSize: 9,
            fontFamily: 'Inter-Bold',
            letterSpacing: 1,
            marginTop: 2,
          },
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={route.name} focused={focused} color={color} />
          ),
        })}
      >
        <Tab.Screen name="Today"    component={TodayScreen} />
        <Tab.Screen name="Habits"   component={HabitsScreen} />
        <Tab.Screen name="Goals"    component={GoalsScreen} />
        <Tab.Screen name="Physical" component={PhysicalScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'Orbitron':   require('./assets/fonts/Orbitron-Bold.ttf'),
    'Inter':      require('./assets/fonts/Inter-Regular.ttf'),
    'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
  });

  // null = still checking, false = not done, true = done
  const [onboardingDone, setOnboardingDone] = useState(null);

  useEffect(() => {
  // TEMP: force clear so onboarding shows — remove this line after testing
  AsyncStorage.removeItem('onboarding_done').then(() => {
    setOnboardingDone(false);
  });
}, []);

  // Wait for fonts and storage check
  if (!fontsLoaded || onboardingDone === null) return null;

  return (
    <SafeAreaProvider>
      {onboardingDone
        ? <MainApp />
        : <OnboardingScreen onDone={() => setOnboardingDone(true)} />
      }
    </SafeAreaProvider>
  );
}