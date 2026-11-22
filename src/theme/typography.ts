import type { TextStyle } from 'react-native';
import { palette } from './tokens';

const tabular: TextStyle['fontVariant'] = ['tabular-nums'];

export const type = {
  display: { fontSize: 26, lineHeight: 32, fontWeight: '700', color: palette.text, letterSpacing: -0.3 },
  title: { fontSize: 20, lineHeight: 26, fontWeight: '700', color: palette.text, letterSpacing: -0.2 },
  heading: { fontSize: 16, lineHeight: 22, fontWeight: '600', color: palette.text },
  body: { fontSize: 14, lineHeight: 20, fontWeight: '400', color: palette.text },
  bodySecondary: { fontSize: 14, lineHeight: 20, fontWeight: '400', color: palette.textSecondary },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500', color: palette.textSecondary },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600', color: palette.textMuted, letterSpacing: 0.2 },
  number: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: palette.text, fontVariant: tabular },
  numberLarge: { fontSize: 28, lineHeight: 34, fontWeight: '700', color: palette.text, fontVariant: tabular, letterSpacing: -0.5 },
  numberSmall: { fontSize: 12, lineHeight: 16, fontWeight: '600', color: palette.textSecondary, fontVariant: tabular },
} satisfies Record<string, TextStyle>;
