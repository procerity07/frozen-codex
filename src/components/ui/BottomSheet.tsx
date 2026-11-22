import { type ReactNode, useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { palette, radius, space, type } from '@/theme';
import { IconButton } from './primitives';

/** Thumb-friendly bottom drawer with slide-up animation and scrim dismissal. */
export function BottomSheet({ visible, onClose, title, subtitle, children, heightRatio = 0.85, scroll = true }: {
  visible: boolean; onClose: () => void; title: string; subtitle?: string; children: ReactNode; heightRatio?: number; scroll?: boolean;
}) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const y = useRef(new Animated.Value(height)).current;
  useEffect(() => {
    if (visible) Animated.spring(y, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220, mass: 0.9 }).start();
    else y.setValue(height);
  }, [visible, height, y]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <Pressable style={st.scrim} onPress={onClose} accessibilityLabel="Close" />
      <Animated.View style={[st.sheet, scroll ? { maxHeight: height * heightRatio } : { height: height * heightRatio }, { paddingBottom: insets.bottom + space.md, transform: [{ translateY: y }] }]}>
        <View style={st.grabber} />
        <View style={st.header}>
          <View style={{ flex: 1 }}>
            <Text style={type.title} numberOfLines={2}>{title}</Text>
            {subtitle ? <Text style={[type.caption, { marginTop: 2 }]}>{subtitle}</Text> : null}
          </View>
          <IconButton icon={X} onPress={onClose} label="Close sheet" />
        </View>
        {scroll ? (
          <ScrollView contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space.lg }} keyboardShouldPersistTaps="handled">{children}</ScrollView>
        ) : (
          <View style={{ flex: 1 }}>{children}</View>
        )}
      </Animated.View>
    </Modal>
  );
}

const st = StyleSheet.create({
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: palette.overlay },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: palette.modal, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderWidth: 1, borderColor: palette.borderStrong },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: palette.borderStrong, marginTop: space.sm },
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.md, gap: space.sm },
});
