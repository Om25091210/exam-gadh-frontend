import { Tabs } from 'expo-router';
import { GraduationCap, Home, Trophy, User, ClipboardList } from 'lucide-react-native';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '@/lib/i18n';
import { C, shadow } from '@/theme';

export default function TabsLayout() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const icon = (Icon: typeof Home) => ({ color, focused }: { color: unknown; focused: boolean }) => (
    <View style={{ width: 46, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? C.primarySoft : 'transparent' }}>
      <Icon size={21} color={String(color)} strokeWidth={focused ? 2.6 : 2} />
    </View>
  );
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 2 },
        tabBarStyle: { position: 'absolute', left: 12, right: 12, bottom: Math.max(insets.bottom, 10), height: 66, borderRadius: 26, backgroundColor: C.white, borderTopWidth: 0, paddingTop: 8, paddingBottom: 8, ...shadow.lift, ...(Platform.OS === 'web' ? { maxWidth: 520, alignSelf: 'center' } : null) },
        sceneStyle: { backgroundColor: C.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('app.tab.home'), tabBarIcon: icon(Home) }} />
      <Tabs.Screen name="tests" options={{ title: t('app.tab.tests'), tabBarIcon: icon(ClipboardList) }} />
      <Tabs.Screen name="learn" options={{ title: t('app.tab.learn'), tabBarIcon: icon(GraduationCap) }} />
      <Tabs.Screen name="rank" options={{ title: t('app.tab.rank'), tabBarIcon: icon(Trophy) }} />
      <Tabs.Screen name="me" options={{ title: t('app.tab.me'), tabBarIcon: icon(User) }} />
    </Tabs>
  );
}
