import { useState } from 'react';
import { Pressable, Text, type StyleProp, type TextStyle } from 'react-native';
import { palette, type } from '@/theme';
import { firstSentence } from '@/lib/text';

export { firstSentence };

/** Shows the first sentence; tap to see everything. */
export function MoreText({ text, style }: { text: string; style?: StyleProp<TextStyle> }) {
  const [open, setOpen] = useState(false);
  const short = firstSentence(text);
  const hasMore = short.replace(/…$/, '').length < text.trim().length;
  if (!hasMore) return <Text style={style}>{text}</Text>;
  return (
    <Pressable onPress={() => setOpen(!open)} accessibilityRole="button" accessibilityState={{ expanded: open }}>
      <Text style={style}>
        {open ? text : short}
        <Text style={[type.caption, { color: palette.cyan }]}>{open ? '  Less' : '  More'}</Text>
      </Text>
    </Pressable>
  );
}
