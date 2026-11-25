import 'react-native';

declare module 'react-native' {
  interface TextProps {
    /** Keep this text exactly as written when auto-translate is on. */
    noTranslate?: boolean;
  }
}
