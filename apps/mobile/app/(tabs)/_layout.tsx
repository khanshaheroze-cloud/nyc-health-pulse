import { useEffect, useState } from "react";
import { View } from "react-native";
import { Tabs, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "../../theme/tokens";
import {
  IconActivity,
  IconUtensils,
  IconClipboard,
  IconUser,
} from "../../components/ui/Icons";

function TabBarIcon({
  Icon,
  focused,
}: {
  Icon: React.FC<{ size?: number; color?: string }>;
  focused: boolean;
}) {
  const color = focused ? colors.accentSage : colors.textTertiary;

  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        width: 44,
        height: 28,
        backgroundColor: focused ? "#E8F0EA" : "transparent",
        borderRadius: 14,
      }}
    >
      <Icon size={20} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("pulse-onboarded").then((val) => {
      if (val !== "true") {
        router.replace("/onboarding");
      } else {
        setReady(true);
      }
    });
  }, []);

  if (!ready) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentSage,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          position: "absolute" as const,
          backgroundColor: "rgba(255,255,255,0.92)",
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
          height: 88,
          paddingBottom: 18,
          paddingTop: 10,
          paddingHorizontal: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600" as const,
          fontFamily: "PlusJakartaSans_600SemiBold",
          marginTop: 3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Overview",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon Icon={IconActivity} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="eat-smart"
        options={{
          title: "Eat Smart",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon Icon={IconUtensils} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: "Log",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon Icon={IconClipboard} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon Icon={IconUser} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen name="neighborhood" options={{ href: null }} />
    </Tabs>
  );
}
