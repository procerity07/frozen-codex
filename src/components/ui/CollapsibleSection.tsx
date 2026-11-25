import { useState, type ReactNode } from 'react';
import { LayoutAnimation, Pressable, View } from 'react-native';
import { ChevronDown, ChevronRight, type LucideIcon } from 'lucide-react-native';
import { palette } from '@/theme';
import { SectionHeader, haptic } from './primitives';

/** A section header you can tap to fold its content away. */
export function CollapsibleSection({ title, subtitle, icon, right, initiallyOpen = true, children }: {
  title: string; subtitle?: string; icon?: LucideIcon; right?: ReactNode; initiallyOpen?: boolean; children: ReactNode;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const Chevron = open ? ChevronDown : ChevronRight;
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => { haptic(); LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setOpen((o) => !o); }}
      >
        <SectionHeader title={title} subtitle={open ? subtitle : undefined} icon={icon}
          right={<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>{right}<Chevron size={18} color={palette.textSecondary} /></View>} />
      </Pressable>
      {open ? children : null}
    </View>
  );
}
