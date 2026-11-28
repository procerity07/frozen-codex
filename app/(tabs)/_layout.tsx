import { Redirect, Tabs } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { BookOpen, CalendarDays, Crown, House, TrendingUp, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommanderBar } from '@/components/domain/CommanderBar';
import { palette } from '@/theme';
import { AppTour } from '@/components/domain/AppTour';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const onboarded = useAppStore((st) => st.onboarded);
  if (!onboarded) return <Redirect href="/onboarding" />;
  return (
    <>
    <Tabs
      screenOptions={{
        header: () => <CommanderBar />,
        tabBarActiveTintColor: palette.cyan,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarStyle: { backgroundColor: palette.surface, borderTopColor: palette.goldLine, borderTopWidth: 1, height: 70 + insets.bottom, paddingTop: 6, paddingBottom: insets.bottom + 8 },
        tabBarItemStyle: { paddingBottom: 4, height: 60 },
        tabBarLabelStyle: { fontSize: 11, lineHeight: 16, fontWeight: '600', marginTop: 2, overflow: 'visible' },
        sceneStyle: { backgroundColor: palette.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <House color={color} size={size - 2} /> }} />
      <Tabs.Screen name="heroes" options={{ title: 'Heroes', tabBarIcon: ({ color, size }) => <Crown color={color} size={size - 2} /> }} />
      <Tabs.Screen name="events" options={{ title: 'Events', tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size - 2} /> }} />
      <Tabs.Screen name="progression" options={{ title: 'Progress', tabBarIcon: ({ color, size }) => <TrendingUp color={color} size={size - 2} /> }} />
      <Tabs.Screen name="guides" options={{ title: 'Guides', tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size - 2} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <User color={color} size={size - 2} /> }} />
    </Tabs>
    <AppTour />
    </>
  );
}
