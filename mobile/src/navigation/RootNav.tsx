import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BrandBar, ToastBanner } from "../components/chrome";
import { DashboardScreen } from "../screens/DashboardScreen";
import { DownloadsScreen } from "../screens/DownloadsScreen";
import { GalleryScreen } from "../screens/GalleryScreen";
import { GranthsScreen } from "../screens/GranthsScreen";
import { PramansScreen } from "../screens/PramansScreen";
import { TopicsScreen } from "../screens/TopicsScreen";
import { useApp } from "../state/AppProvider";
import type { ReactNode } from "react";
import { View } from "react-native";

export type RootStackParamList = {
  Home: undefined;
  Gallery: undefined;
  Downloads: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Topics: undefined;
  Granths: undefined;
  Pramans: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function Tabs() {
  const { colors } = useApp();
  return (
    <Tab.Navigator
      screenOptions={{
        header: () => <BrandBar />,
        tabBarActiveTintColor: colors.goldLight,
        tabBarInactiveTintColor: "rgba(253,246,227,0.72)",
        tabBarStyle: { backgroundColor: colors.maroon, borderTopColor: colors.gold, height: 62, paddingBottom: 6, paddingTop: 4 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} /> }} />
      <Tab.Screen name="Topics" component={TopicsScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="list" color={color} size={size} /> }} />
      <Tab.Screen name="Granths" component={GranthsScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="book" color={color} size={size} /> }} />
      <Tab.Screen name="Pramans" component={PramansScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="images" color={color} size={size} /> }} />
    </Tab.Navigator>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <View style={{ flex: 1 }}>
      {children}
      <ToastBanner />
    </View>
  );
}

export function RootNav() {
  const { colors } = useApp();
  return (
    <Shell>
      <Stack.Navigator screenOptions={{ header: () => <BrandBar back />, contentStyle: { backgroundColor: colors.cream } }}>
        <Stack.Screen name="Home" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen name="Gallery" component={GalleryScreen} />
        <Stack.Screen name="Downloads" component={DownloadsScreen} />
      </Stack.Navigator>
    </Shell>
  );
}
