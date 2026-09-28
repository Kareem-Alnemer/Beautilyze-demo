import React from 'react';
import { Stack } from 'expo-router';
import { AuthGate } from '../src/auth/AuthGate';
import { OnboardingGate } from '../src/auth/OnboardingGate';
import { FontProvider } from '../src/components/ui/FontProvider';

export default function RootLayout() {
  return <FontProvider><AuthGate><OnboardingGate /><Stack screenOptions={{ headerShown: false }} /></AuthGate></FontProvider>;
}
