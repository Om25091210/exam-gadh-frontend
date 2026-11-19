import { router } from 'expo-router';
import { BookMarked, ChevronRight, Mic, Newspaper, NotebookPen, ScrollText, type LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useI18n, type MessageKey } from '@/lib/i18n';
import { C, shadow, type Tone } from '@/theme';
import { Row, Screen, Sticker, T, useTabPad } from '@/ui';

const ITEMS: Array<{ href: string; title: MessageKey; sub: MessageKey; icon: LucideIcon; tone: Tone }> = [
  { href: '/notes', title: 'app.learn.notes', sub: 'app.learn.notes.sub', icon: NotebookPen, tone: 'mint' },
  { href: '/ca', title: 'app.learn.ca', sub: 'app.learn.ca.sub', icon: Newspaper, tone: 'peach' },
  { href: '/pyq', title: 'app.learn.pyq', sub: 'app.learn.pyq.sub', icon: ScrollText, tone: 'lilac' },
  { href: '/materials', title: 'app.learn.material', sub: 'app.learn.material.sub', icon: BookMarked, tone: 'sky' },
  { href: '/interview', title: 'app.learn.interview', sub: 'app.learn.interview.sub', icon: Mic, tone: 'gold' },
];

export default function LearnTab() {
  const { t } = useI18n();
  const pad = useTabPad();
  return (
    <Screen bottomPad={pad}>
      <T v="h1" style={{ paddingTop: 12, paddingBottom: 14 }}>{t('app.learn.title')}</T>
      <View style={{ gap: 12 }}>
        {ITEMS.map((i) => (
          <Pressable key={i.href} onPress={() => router.push(i.href as never)} accessibilityRole="button" style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}>
            <Row style={{ backgroundColor: C.white, borderRadius: 24, padding: 14, ...shadow.card }}>
              <Sticker icon={i.icon} tone={i.tone} size={64} />
              <View style={{ flex: 1 }}>
                <T v="h3">{t(i.title)}</T>
                <T v="small">{t(i.sub)}</T>
              </View>
              <ChevronRight size={22} color={C.faint} />
            </Row>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
