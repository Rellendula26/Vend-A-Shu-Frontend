import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useUser } from '@/context/UserContext';

export default function Splash() {
  const colors = useColors();
  const router = useRouter();
  const { currentUser, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded) return;
    const t = setTimeout(() => {
      if (currentUser) {
        router.replace('/home');
      } else {
        router.replace('/onboarding');
      }
    }, 2200);
    return () => clearTimeout(t);
  }, [isLoaded, currentUser]);

  return (
    <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      <View style={styles.logoRow}>
        <Text style={styles.logoEmoji}>👠</Text>
        <View>
          <Text style={[styles.venda, { color: colors.navy }]}>VENDA</Text>
          <Text style={[styles.shu, { color: colors.primary }]}>SHU</Text>
        </View>
      </View>
      <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
        Your automated shoe storage
      </Text>
      <View style={[styles.wave, { backgroundColor: colors.accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoEmoji: { fontSize: 52 },
  venda: { fontSize: 18, letterSpacing: 4, fontFamily: 'Inter_500Medium' },
  shu: { fontSize: 34, letterSpacing: 5, fontFamily: 'Inter_700Bold' },
  tagline: { marginTop: 16, fontSize: 14, fontFamily: 'Inter_400Regular' },
  wave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    borderTopLeftRadius: 80,
    borderTopRightRadius: 80,
  },
});
