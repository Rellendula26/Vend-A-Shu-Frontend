import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useUser } from '@/context/UserContext';
import { AppHeader, OrangeButton, useScreenInsets } from '@/components/vas';
import { useListUsers } from '@workspace/api-client-react';
import type { User } from '@workspace/api-client-react';

export default function SelectUser() {
  const colors = useColors();
  const router = useRouter();
  const insets = useScreenInsets();
  const { selectUser } = useUser();
  const { data: users, isLoading, isError, refetch } = useListUsers();
  const [selected, setSelected] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [remember, setRemember] = useState(true);

  const go = async () => {
    if (!selected) {
      Alert.alert('Please select a user');
      return;
    }
    await selectUser(selected, remember);
    router.replace('/home');
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <AppHeader />
      <View
        style={[
          styles.card,
          { backgroundColor: colors.secondary, marginBottom: insets.bottom + 16 },
        ]}
      >
        <Text style={[styles.hi, { color: colors.navy }]}>Hi!</Text>
        <Text style={[styles.welcome, { color: colors.navy }]}>Welcome</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          I am waiting for you, please enter your details
        </Text>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
        ) : isError ? (
          <TouchableOpacity onPress={() => refetch()} style={styles.errorBox}>
            <Text style={{ color: colors.destructive, fontFamily: 'Inter_500Medium' }}>
              Could not load users. Tap to retry.
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[
                styles.dropdown,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => setOpen(!open)}
              testID="user-dropdown"
            >
              <Text
                style={{
                  color: selected ? colors.navy : colors.mutedForeground,
                  fontSize: 15,
                  fontFamily: selected ? 'Inter_600SemiBold' : 'Inter_400Regular',
                }}
              >
                {selected?.name ?? 'Select User'}
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
                {(users ?? []).map(u => (
                  <TouchableOpacity
                    key={u.id}
                    style={[styles.dropdownItem, { borderBottomColor: colors.muted }]}
                    onPress={() => {
                      setSelected(u);
                      setOpen(false);
                    }}
                    testID={`user-option-${u.name}`}
                  >
                    <View style={[styles.userAvatar, { backgroundColor: colors.navy }]}>
                      <Text style={styles.userAvatarText}>{u.name[0]}</Text>
                    </View>
                    <Text style={{ color: colors.navy, fontSize: 15, fontFamily: 'Inter_500Medium' }}>
                      {u.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        <View style={styles.rememberRow}>
          <TouchableOpacity
            onPress={() => setRemember(!remember)}
            style={[
              styles.toggle,
              { backgroundColor: remember ? colors.primary : colors.border },
            ]}
            testID="remember-toggle"
          >
            <View
              style={[
                styles.toggleThumb,
                remember && { alignSelf: 'flex-end' },
              ]}
            />
          </TouchableOpacity>
          <Text style={{ color: colors.mutedForeground, fontSize: 14, fontFamily: 'Inter_400Regular' }}>
            Remember me
          </Text>
        </View>

        <OrangeButton title="Go to my VAS" onPress={go} testID="go-to-vas" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { flex: 1, padding: 24, margin: 16, borderRadius: 20 },
  hi: { fontSize: 36, fontFamily: 'Inter_700Bold' },
  welcome: { fontSize: 44, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  sub: { fontSize: 14, marginBottom: 24, fontFamily: 'Inter_400Regular' },
  dropdown: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownList: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: { color: '#FFF', fontFamily: 'Inter_700Bold', fontSize: 13 },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
  },
  toggle: {
    width: 48,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    padding: 2,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF',
  },
  errorBox: { paddingVertical: 16 },
});
