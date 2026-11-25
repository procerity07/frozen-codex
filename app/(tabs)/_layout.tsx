import { Redirect, Tabs } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { BookOpen, CalendarDays, Castle, Crown, House, Settings, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommanderBar } from '@/components/domain/CommanderBar';
import { palette } from '@/theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const onboarded = useAppStore((st) => st.onboarded);
  if (!onboarded) return <Redirect href="/onboarding" />;
  return (
    <Tabs
      screenOptions={{
        header: () => <CommanderBar />,
        tabBarActiveTintColor: palette.cyan,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarStyle: { backgroundColor: palette.bg, borderTopColor: palette.border, height: 60 + insets.bottom, paddingTop: 6, paddingBottom: insets.bottom + 6 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        sceneStyle: { backgroundColor: palette.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Command', tabBarIcon: ({ color, size }) => <House color={color} size={size - 2} /> }} />
      <Tabs.Screen name="heroes" options={{ title: 'Heroes', tabBarIcon: ({ color, size }) => <Crown color={color} size={size - 2} /> }} />
      <Tabs.Screen name="events" options={{ title: 'Events', tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size - 2} /> }} />
      <Tabs.Screen name="progression" options={{ title: 'Citadel', tabBarIcon: ({ color, size }) => <Castle color={color} size={size - 2} /> }} />
      <Tabs.Screen name="guides" options={{ title: 'Guides', tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size - 2} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <User color={color} size={size - 2} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color, size }) => <Settings color={color} size={size - 2} /> }} />
    </Tabs>
  );
}
