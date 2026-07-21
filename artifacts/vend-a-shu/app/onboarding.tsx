import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { GhostButton, OrangeButton, useScreenInsets } from '@/components/vas';

const SLIDES: {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  desc: string;
}[] = [
  {
    icon: 'wifi',
    title: 'Connect to Wifi',
    desc: 'Make sure you are connected to your Wifi Router to continue using this app.',
  },
  {
    icon: 'user',
    title: 'Create Users',
    desc: 'Connect to your VAS database and create users who can have access to the VAS system.',
  },
  {
    icon: 'check-circle',
    title: 'Select User and Get Started!',
    desc: 'Select your username from the dropdown menu on the start page and get started.',
  },
  {
    icon: 'archive',
    title: 'Know your Bins and Locations!',
    desc: 'Each bin can hold one, two or three items. Locations are labeled Left Front, Rear, and Right Front.',
  },
];

export default function Onboarding() {
  const colors = useColors();
  const router = useRouter();
  const insets = useScreenInsets();
  const [page, setPage] = useState(0);
  const slide = SLIDES[page]!;
  const isLast = page === SLIDES.length - 1;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.card}>
        <View style={[styles.iconCircle, { backgroundColor: colors.accent }]}>
          <Feather name={slide.icon} size={44} color={colors.navy} />
        </View>
        <Text style={[styles.title, { color: colors.navy }]}>{slide.title}</Text>
        <Text style={[styles.desc, { color: colors.mutedForeground }]}>
          {slide.desc}
        </Text>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === page ? colors.primary : colors.border,
                  width: i === page ? 20 : 8,
                },
              ]}
            />
          ))}
        </View>
      </View>
      <View style={styles.buttons}>
        <OrangeButton
          title={isLast ? 'Get Started' : 'Next'}
          onPress={() =>
            isLast ? router.push('/connect') : setPage(page + 1)
          }
          testID="onboarding-next"
        />
        {page > 0 && (
          <GhostButton title="Back" onPress={() => setPage(page - 1)} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  desc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
  },
  dots: { flexDirection: 'row', gap: 8, marginTop: 28 },
  dot: { height: 8, borderRadius: 4 },
  buttons: { padding: 20, gap: 8 },
});
