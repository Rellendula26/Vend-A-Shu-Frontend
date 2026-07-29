import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { UserProvider } from '@/context/UserContext';
import { setBaseUrl } from '@workspace/api-client-react';
import { resolveInitialApiBaseUrl } from '@/lib/api-base-url';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="connect" />
      <Stack.Screen name="select-user" />
      <Stack.Screen name="home" />
      <Stack.Screen name="add-shoes" />
      <Stack.Screen name="vend-shoes" />
      <Stack.Screen name="return-shoes" />
    </Stack>
  );
}

export default function RootLayout() {
  const [apiBaseReady, setApiBaseReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    resolveInitialApiBaseUrl()
      .then(url => {
        if (url) {
          setBaseUrl(url);
        } else {
          setBaseUrl(null);
        }
      })
      .finally(() => {
        setApiBaseReady(true);
      });
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && apiBaseReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, apiBaseReady]);

  if ((!fontsLoaded && !fontError) || !apiBaseReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <UserProvider>
            <GestureHandlerRootView>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </UserProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
