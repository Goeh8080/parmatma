import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootNav } from "./src/navigation/RootNav";
import { AppProvider } from "./src/state/AppProvider";

export function App() {
  const [fontsLoaded] = useFonts({
    NotoSansDevanagari: require("./assets/fonts/NotoSansDevanagari-Regular.ttf"),
  });
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: "#7B1F2E", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#C9A84C" />
      </View>
    );
  }
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer
          theme={{
            ...DefaultTheme,
            colors: {
              ...DefaultTheme.colors,
              primary: "#7B1F2E",
              background: "#FDF6E3",
              card: "#7B1F2E",
              text: "#FDF6E3",
              border: "#C9A84C",
              notification: "#E8821A",
            },
          }}
        >
          <StatusBar style="light" />
          <RootNav />
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}
