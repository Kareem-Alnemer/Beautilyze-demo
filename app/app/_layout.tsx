import React from 'react';
import { Stack } from 'expo-router';
import { AuthGate } from '../src/auth/AuthGate';
import { OnboardingGate } from '../src/auth/OnboardingGate';

export default function RootLayout() {
  return <AuthGate><OnboardingGate /><Stack screenOptions={{ headerShown: false }} /></AuthGate>;
}
