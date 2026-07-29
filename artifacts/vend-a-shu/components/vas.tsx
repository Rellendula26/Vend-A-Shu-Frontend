import React, { useState } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ImageStyle,
  type TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import type { Shoe } from '@workspace/api-client-react';
import { getBaseUrl } from '@workspace/api-client-react';

export function useScreenInsets() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  return {
    top: isWeb ? Math.max(insets.top, 67) : insets.top,
    bottom: isWeb ? Math.max(insets.bottom, 34) : insets.bottom,
  };
}

export function shoeEmoji(shoe: Pick<Shoe, 'shoeType' | 'isBoots'>): string {
  const t = shoe.shoeType.toLowerCase();
  if (shoe.isBoots || /boot/.test(t)) return '🥾';
  if (/heel|pump|stiletto/.test(t)) return '👠';
  if (/sandal|slide|flip/.test(t)) return '👡';
  if (/loafer|oxford|dress|derby/.test(t)) return '👞';
  if (/ballet|flat/.test(t)) return '🩰';
  return '👟';
}

/** Shows the shoe's processed photo when available, otherwise its emoji. */
export function ShoeImage({
  shoe,
  imageStyle,
  emojiStyle,
}: {
  shoe: Pick<Shoe, 'shoeType' | 'isBoots' | 'imagePath'>;
  imageStyle: StyleProp<ImageStyle>;
  emojiStyle: StyleProp<TextStyle>;
}) {
  if (shoe.imagePath) {
    const apiOrigin = getBaseUrl();
    if (apiOrigin) {
      return (
        <Image
          source={{ uri: `${apiOrigin}${shoe.imagePath}` }}
          style={imageStyle}
          resizeMode="cover"
        />
      );
    }
  }
  return <Text style={emojiStyle}>{shoeEmoji(shoe)}</Text>;
}

export function AppHeader() {
  const colors = useColors();
  return (
    <View style={styles.appHeader}>
      <Text style={styles.appHeaderEmoji}>👠</Text>
      <View>
        <Text style={[styles.appHeaderVenda, { color: colors.mutedForeground }]}>
          VENDA
        </Text>
        <Text style={[styles.appHeaderShu, { color: colors.navy }]}>SHU</Text>
      </View>
    </View>
  );
}

export function BackHeader({ title, onBack }: { title?: string; onBack?: () => void }) {
  const colors = useColors();
  const router = useRouter();
  return (
    <View style={styles.backHeader}>
      <TouchableOpacity
        onPress={onBack ?? (() => router.back())}
        style={styles.backBtn}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        testID="back-button"
      >
        <Feather name="chevron-left" size={28} color={colors.navy} />
      </TouchableOpacity>
      <AppHeader />
      {title ? (
        <Text style={[styles.backTitle, { color: colors.navy }]}>{title}</Text>
      ) : null}
    </View>
  );
}

export function OrangeButton({
  title,
  onPress,
  disabled,
  testID,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[
        styles.orangeBtn,
        { backgroundColor: disabled ? '#CCCCCC' : colors.primary },
      ]}
      onPress={() => {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        onPress();
      }}
      disabled={disabled}
      activeOpacity={0.85}
      testID={testID}
    >
      <Text style={[styles.orangeBtnText, { color: colors.primaryForeground }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

export function GhostButton({
  title,
  onPress,
  testID,
}: {
  title: string;
  onPress: () => void;
  testID?: string;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.ghostBtn, { borderColor: colors.navy }]}
      onPress={onPress}
      activeOpacity={0.7}
      testID={testID}
    >
      <Text style={[styles.ghostBtnText, { color: colors.navy }]}>{title}</Text>
    </TouchableOpacity>
  );
}

export function Dropdown<T extends string>({
  value,
  placeholder,
  options,
  onSelect,
  testID,
}: {
  value: T | '';
  placeholder: string;
  options: readonly T[];
  onSelect: (v: T) => void;
  testID?: string;
}) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  return (
    <View>
      <TouchableOpacity
        style={[
          styles.dropdown,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        onPress={() => setOpen(!open)}
        testID={testID}
      >
        <Text
          style={
            value
              ? [styles.dropdownSelected, { color: colors.navy }]
              : [styles.dropdownPlaceholder, { color: colors.mutedForeground }]
          }
        >
          {value || placeholder}
        </Text>
        <Feather
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.mutedForeground}
        />
      </TouchableOpacity>
      {open && (
        <View
          style={[
            styles.dropdownList,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {options.map(o => (
            <TouchableOpacity
              key={o}
              style={[styles.dropdownItem, { borderBottomColor: colors.muted }]}
              onPress={() => {
                onSelect(o);
                setOpen(false);
              }}
              testID={`${testID ?? 'dropdown'}-option-${o}`}
            >
              <Text style={[styles.dropdownItemText, { color: colors.navy }]}>
                {o}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export function DetailRow({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Text style={[styles.detailValue, { color: colors.navy }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  appHeaderEmoji: { fontSize: 28 },
  appHeaderVenda: { fontSize: 10, letterSpacing: 3, fontFamily: 'Inter_500Medium' },
  appHeaderShu: { fontSize: 16, letterSpacing: 3, fontFamily: 'Inter_700Bold' },
  backHeader: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { paddingLeft: 12 },
  backTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginLeft: 4 },
  orangeBtn: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 4,
  },
  orangeBtnText: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  ghostBtn: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 4,
  },
  ghostBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  dropdown: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownPlaceholder: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  dropdownSelected: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  dropdownList: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  dropdownItem: { padding: 14, borderBottomWidth: 1 },
  dropdownItemText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  detailRow: { marginBottom: 12 },
  detailLabel: { fontSize: 11, marginBottom: 2, fontFamily: 'Inter_500Medium' },
  detailValue: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
