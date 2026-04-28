// App.js  —  1Life Hub
// check, and sets up the main navigation structure of the app.
//useState to manage local states
//useEffect runs side effects like reading async storage

import React, { useState, useEffect } from "react";

import { View, Text, StyleSheet } from "react-native";

//Holds the navigation state and links nav links to the app.
import { NavigationContainer } from "@react-navigation/native";

//createBottomTabNavigator creates tab bar at the bottom of screen.
// Each tab renders a different screen component when selected.

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// SafeAreaProvider must wrap the eintire app so that SafeAreaView
//in child screens know the device's safe area elements (like notches, status bars, etc) and can adjust their layout accordingly

import { SafeAreaProvider } from "react-native-safe-area-context";
//useFonts is an expo hook that loads custom font file asynchronously
// app renders null until fonts are ready to avoid text flash

import { useFonts } from "expo-font";
//AsyncStorage is  React-Native's persistent key-value storage system
//used here to remember whether the user has completed onboarding, so we only show it once on first launch
import AsyncStorage from "@react-native-async-storage/async-storage";

//Screen imports
//Each Screen is a seperate component file in screens folder
//Importing them here to allow the Tab.Navigator to render them when their respective tab is selected
import TodayScreen from "./screens/Today";
import HabitsScreen from "./screens/HabitsScreen";
import GoalsScreen from "./screens/GoalsScreen";
import PhysicalScreen from "./screens/Physical";
import OnboardingScreen from "./screens/OnboardingScreen";
//Constants
//createBottomTabNavigator returns a tab object with navigator and screen
const Tab = createBottomTabNavigator();
//Brand colors used across tab bar active states
//habits and today-neon green
//physical health accent-blue
const GREEN = "#00FF87";
const BLUE = "#60a5fa";
//Table icons for each bottom tab, recieves name, focused state, and color from the tab navigator to render the appropriate icon and background
//boolean -is this tab active ? and color from navigator if true returns the active tint color for that tab, which we use to set the icon color and background highlight
function TabIcon({ name, focused, color }) {
  //map each screen name to uinicode symbol
  // Today: home, Habits: diamond, Goals: bullseye, Physical: heart
  // in production app these would be svg icon componets
  const icons = { Today: "⌂", Habits: "◈", Goals: "◎", Physical: "♡" };
  //when focused apply subtle tinted background
  return (
    <View style={[tabS.iconWrap, focused && { backgroundColor: `${color}18` }]}>
      <Text style={[tabS.iconTxt, { color }]}>{icons[name]}</Text>
    </View>
  );
}
//stylesheet.create optimises styles by creating them once at startup
//rather than on every render
const tabS = StyleSheet.create({
  iconWrap: {
    width: 36,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  iconTxt: { fontSize: 16 },
});
//seperated from app so it only comes after onboarding is done
//contains the navigation container and all 4 tab screens
function MainApp() {
  return (
    // tracks navigation state, must wrap all navigators
    //Tab navigator manages the tab bar and switching between screens when tabs are selected
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#08080f",
            borderTopColor: "rgba(255,255,255,0.06)",
            borderTopWidth: 1,
            height: 70,
            paddingBottom: 10,
            paddingTop: 6,
          },
          //shorthand function to return a diferent color for each tab when it's active
          tabBarActiveTintColor: (() => {
            if (route.name === "Physical") return BLUE;
            if (route.name === "Goals") return "#c084fc";
            return GREEN;
          })(),

          //ionactive bar color is a muted gray for all tabs
          tabBarInactiveTintColor: "#44445a",
          tabBarLabelStyle: {
            fontSize: 9,
            fontFamily: "Inter-Bold",
            letterSpacing: 1,
            marginTop: 2,
          },
          //Render our custom TabIcon component for every tab
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={route.name} focused={focused} color={color} />
          ),
        })}
      >
        {/*each tab.screen registers a named route and links it to a component*/}
        <Tab.Screen name="Today" component={TodayScreen} />
        <Tab.Screen name="Habits" component={HabitsScreen} />
        <Tab.Screen name="Goals" component={GoalsScreen} />
        <Tab.Screen name="Physical" component={PhysicalScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
//Root component of app
//this is entry point registered index.js
//responsible for loading fonts,check onboarding status, and rendering either onboarding or main app navigation
//either OnboardingScreen or MainApp
export default function App() {
  //useFonts hook loads font files asynchronously from assets folder
  //Returns [fonts loaded boolean] which is false until fonts are ready, preventing app from rendering until custom fonts are loaded to avoid flash of unstyled text
  const [fontsLoaded] = useFonts({
    Orbitron: require("./assets/fonts/Orbitron-Bold.ttf"),
    Inter: require("./assets/fonts/Inter-Regular.ttf"),
    "Inter-Bold": require("./assets/fonts/Inter-Bold.ttf"),
  });
  //onboarding has 3 states
  //if null = still reading asynchstorage
  // if false = user has not not completed onboarding
  //if true  = user has completed has completed onboarding, go to main app

  const [onboardingDone, setOnboardingDone] = useState(null);
  //useEffect with empty dependancy array[], run once after first render
  // reads async storage to check if onboarding was previously completed
  //asynch storage.removeitem is used during during developement  to force onboarding to show, this line should be removed before final subsmission

  useEffect(() => {
    // TEMP: force clear so onboarding shows — remove this line after testing
    AsyncStorage.removeItem("onboarding_done").then(() => {
      setOnboardingDone(false);
    });
  }, []);
  // Guard clause - dont render anything while fonts or storage are loading
  //this prevents a white flash or missing font errors on app startup, ensuring a smooth user experience by only rendering the app once all resources are ready
  // Wait for fonts and storage check
  if (!fontsLoaded || onboardingDone === null) return null;
  //safeAreaProvider makes device insets available  to child components
  //safeare view components throught out the app

  return (
    <SafeAreaProvider>
      {/*Ternary conditional rendering , if onboarding is done, show the main app with tab navigation otherwise show the onboarding flow and pass onDone as a callback prop
      when onboardingscreen calls onDone function, it starts updates to true
      and mainapp renders without needing to navigate */}
      {onboardingDone ? (
        <MainApp />
      ) : (
        <OnboardingScreen onDone={() => setOnboardingDone(true)} />
      )}
    </SafeAreaProvider>
  );
}
