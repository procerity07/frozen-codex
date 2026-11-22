import { type ReactNode, useState } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { palette, radius, space, type } from '@/theme';
import { haptic } from './primitives';

export function Accordion({ title, subtitle, right, children, initiallyOpen = false, accent }: {
  title: string; subtitle?: string; right?: ReactNode; children: ReactNode; initiallyOpen?: boolean; accent?: string;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <View style={[st.wrap, accent ? { borderLeftWidth: 3, borderLeftColor: accent } : null]}>
      <Pressable
        style={st.head}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => { haptic(); LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setOpen((o) => !o); }}
      >
        <View style={{ flex: 1 }}>
          <Text style={type.heading} numberOfLines={2}>{title}</Text>
          {subtitle ? <Text style={[type.caption, { marginTop: 2 }]} numberOfLines={2}>{subtitle}</Text> : null}
        </View>
        {right}
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <ChevronDown size={18} color={palette.textSecondary} />
        </View>
      </Pressable>
      {open ? <View style={st.body}>{children}</View> : null}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: radius.lg, marginBottom: space.sm, overflow: 'hidden' },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.lg, minHeight: 56 },
  body: { paddingHorizontal: space.lg, paddingBottom: space.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.border, paddingTop: space.md },
});
