import { type ReactNode } from 'react';
import { ScrollView, View, type ScrollViewProps } from 'react-native';
import { palette, space } from '@/theme';

/** Standard scrolling screen body (the Commander Bar sits above it in the tab layout). */
export function Screen({ children, sticky, ...rest }: { children: ReactNode; sticky?: ReactNode } & ScrollViewProps) {
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      {sticky}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: 48, paddingTop: sticky ? space.xs : space.md }}
        keyboardShouldPersistTaps="handled"
        {...rest}
      >
        {children}
      </ScrollView>
    </View>
  );
}
