/**
 * Every `import ... from 'react-native'` in app/ and src/ is pointed here by metro.config.js.
 * It is react-native itself, except `Text`, which shows the phone-language translation when
 * auto-translate is on. Add `noTranslate` to a <Text> to keep it exactly as written.
 */
import React, { useSyncExternalStore } from 'react';
import { Text as RNText, type TextProps } from 'react-native';
import { activeLanguage, getStatus, lookup, shouldTranslate, subscribe } from './autoTranslate';

export * from 'react-native';

function plainText(children: React.ReactNode): string | null {
  if (typeof children === 'string') return children;
  if (Array.isArray(children) && children.length > 0 && children.every((c) => typeof c === 'string' || typeof c === 'number')) {
    return children.join('');
  }
  return null;
}

let tick = 0;
subscribe(() => {
  tick += 1;
}, true);
const useVersion = () => useSyncExternalStore((l) => subscribe(l), () => tick);

const TranslatedText = React.forwardRef<React.ElementRef<typeof RNText>, TextProps & { noTranslate?: boolean }>(
  function Text({ noTranslate, children, ...rest }, ref) {
    useVersion();
    let shown: React.ReactNode = children;
    if (!noTranslate && activeLanguage()) {
      const s = plainText(children);
      if (s != null && shouldTranslate(s)) {
        const lead = s.match(/^\s*/)?.[0] ?? '';
        const tail = s.match(/\s*$/)?.[0] ?? '';
        const t = lookup(s.trim());
        if (t != null) shown = lead + t + tail;
      }
    }
    return (
      <RNText ref={ref} {...rest}>
        {shown}
      </RNText>
    );
  },
);

export const Text = TranslatedText as unknown as typeof RNText;
