import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { setBaseUrl, useHealthCheck } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { AppHeader, OrangeButton, useScreenInsets } from '@/components/vas';
import {
  checkApiHealth,
  CONNECT_ERROR_MESSAGE,
  persistApiBaseUrl,
  resolveConnectTarget,
} from '@/lib/api-base-url';

export default function Connect() {
  const colors = useColors();
  const router = useRouter();
  const insets = useScreenInsets();
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('');
  const [connecting, setConnecting] = useState(false);
  const { isError } = useHealthCheck();

  const handleConnect = async () => {
    if (connecting) {
      return;
    }

    setConnecting(true);
    try {
      const target = await resolveConnectTarget(ip, port);
      if (!target) {
        Alert.alert('Connection failed', CONNECT_ERROR_MESSAGE);
        return;
      }

      const healthy = await checkApiHealth(target);
      if (!healthy) {
        Alert.alert('Connection failed', CONNECT_ERROR_MESSAGE);
        return;
      }

      await persistApiBaseUrl(target);
      setBaseUrl(target);
      router.push('/select-user');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <AppHeader />
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.navy }]}>
          Connect to{'\n'}Database
        </Text>
        <View style={[styles.iconCircle, { backgroundColor: colors.secondary }]}>
          <Feather name="database" size={48} color={colors.navy} />
        </View>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: isError ? '#FEE2E2' : '#DCFCE7' },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isError ? colors.destructive : colors.success },
            ]}
          />
          <Text style={[styles.statusText, { color: colors.navy }]}>
            {isError ? 'VAS database unreachable' : 'VAS database online'}
          </Text>
        </View>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.card, borderColor: colors.border, color: colors.navy },
          ]}
          placeholder="IP Address (optional — auto-connected)"
          placeholderTextColor={colors.mutedForeground}
          value={ip}
          onChangeText={setIp}
          keyboardType="numbers-and-punctuation"
          autoCapitalize="none"
          autoCorrect={false}
          testID="input-ip"
        />
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.card, borderColor: colors.border, color: colors.navy },
          ]}
          placeholder="Port (optional — auto-connected)"
          placeholderTextColor={colors.mutedForeground}
          value={port}
          onChangeText={setPort}
          keyboardType="number-pad"
          testID="input-port"
        />
        <OrangeButton
          title={connecting ? 'Connecting…' : 'Connect'}
          onPress={handleConnect}
          disabled={connecting}
          testID="connect-button"
        />
        <View style={[styles.helpBox, { backgroundColor: colors.peach }]}>
          <Text style={[styles.helpTitle, { color: colors.navy }]}>
            Where can I find my IP?
          </Text>
          <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
            When running against a Raspberry Pi VAS unit, enter its IP and port.
            Here, the app is already connected to the built-in VAS database, so
            you can just tap Connect.
          </Text>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 20 },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  helpBox: { borderRadius: 12, padding: 16, marginTop: 20 },
  helpTitle: { fontFamily: 'Inter_700Bold', marginBottom: 4 },
  helpText: { fontSize: 13, lineHeight: 20, fontFamily: 'Inter_400Regular' },
});
