import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useUser } from '@/context/UserContext';
import { AppHeader, useScreenInsets } from '@/components/vas';
import { useListShoes } from '@workspace/api-client-react';

export default function Home() {
  const colors = useColors();
  const router = useRouter();
  const insets = useScreenInsets();
  const { currentUser, clearUser } = useUser();
  const { data: shoes } = useListShoes();

  const stored = (shoes ?? []).filter(s => s.status === 'stored').length;
  const vended = (shoes ?? []).filter(s => s.status === 'vended').length;

  const menu: {
    icon: React.ComponentProps<typeof Feather>['name'];
    label: string;
    onPress: () => void;
  }[] = [
    { icon: 'plus', label: 'Add Shoes', onPress: () => router.push('/add-shoes') },
    { icon: 'package', label: 'Vend Shoes', onPress: () => router.push('/vend-shoes') },
    { icon: 'rotate-ccw', label: 'Return Shoes', onPress: () => router.push('/return-shoes') },
    {
      icon: 'settings',
      label: 'Options',
      onPress: () => Alert.alert('Options', 'No options currently defined.'),
    },
  ];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.headerRow}>
        <AppHeader />
        <View style={[styles.avatar, { backgroundColor: colors.navy }]}>
          <Text style={styles.avatarText}>{currentUser?.name?.[0] ?? '?'}</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.hello, { color: colors.navy }]}>
          Hello {currentUser?.name ?? 'there'},
        </Text>
        <Text style={[styles.helloSub, { color: colors.mutedForeground }]}>
          Hope you're doing well!
        </Text>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statNum, { color: colors.primary }]}>{stored}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              Shoes stored
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statNum, { color: colors.navySoft }]}>{vended}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              Out of bins
            </Text>
          </View>
        </View>

        <View style={[styles.menuCard, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.menuTitle, { color: colors.navy }]}>
            Where do you want{'\n'}to go?
          </Text>
          <View style={styles.menuGrid}>
            {menu.map(m => (
              <TouchableOpacity
                key={m.label}
                style={[styles.menuBtn, { backgroundColor: colors.card }]}
                onPress={m.onPress}
                activeOpacity={0.8}
                testID={`menu-${m.label}`}
              >
                <View style={[styles.menuIcon, { backgroundColor: colors.navy }]}>
                  <Feather name={m.icon} size={20} color="#FFF" />
                </View>
                <Text style={[styles.menuLabel, { color: colors.navy }]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
      <TouchableOpacity
        style={[styles.closeApp, { paddingBottom: insets.bottom + 12 }]}
        onPress={async () => {
          await clearUser();
          router.replace('/select-user');
        }}
        testID="switch-user"
      >
        <Text style={[styles.closeAppText, { color: colors.navy }]}>
          Switch User
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFF', fontFamily: 'Inter_700Bold', fontSize: 16 },
  content: { padding: 20, paddingBottom: 40 },
  hello: { fontSize: 28, fontStyle: 'italic', fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  helloSub: { fontSize: 14, marginBottom: 20, fontFamily: 'Inter_400Regular' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statNum: { fontSize: 30, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', marginTop: 2 },
  menuCard: { borderRadius: 20, padding: 20 },
  menuTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 16 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  menuBtn: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  menuLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  closeApp: { padding: 16, alignItems: 'center' },
  closeAppText: { textDecorationLine: 'underline', fontSize: 15, fontFamily: 'Inter_500Medium' },
});
