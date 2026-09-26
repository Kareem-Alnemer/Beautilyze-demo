import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useProfileStore } from '../profile/store';
import { theme } from '../theme';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [guest, setGuest] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    let current = 0;
    const load = async (id: string | null) => {
      const request = ++current;
      setReady(false);
      setError('');
      setSignedIn(Boolean(id));
      useProfileStore.getState().setUserId(id);
      try {
        if (id) await useProfileStore.getState().loadProfile(id);
        if (request === current) setReady(true);
      } catch {
        if (request === current) setError('Your profile could not be loaded. Sign out and try again.');
      }
    };
    if (!isSupabaseConfigured) return;
    let authChanged = false;
    void supabase.auth.getSession().then(({ data, error: cause }) => {
      if (authChanged) return;
      if (cause) { setError('Could not restore your session'); setReady(true); }
      else void load(data.session?.user.id ?? null);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      authChanged = true;
      // Start database work after the auth callback releases its internal lock.
      setTimeout(() => { void load(session?.user.id ?? null); }, 0);
    });
    return () => { current++; data.subscription.unsubscribe(); };
  }, []);
  const submit = async (register: boolean) => {
    setBusy(true); setError(''); setMessage('');
    try {
      const credentials = { email: email.trim(), password };
      const result = register ? await supabase.auth.signUp(credentials) : await supabase.auth.signInWithPassword(credentials);
      if (result.error) throw result.error;
      setPassword('');
      if (register && !result.data.session) setMessage('Check your email to confirm your account, then sign in.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Sign-in failed'); }
    finally { setBusy(false); }
  };
  if (!isSupabaseConfigured) return <View style={styles.container}><Text>Supabase configuration is missing.</Text></View>;
  if ((ready && signedIn) || (guest && !signedIn)) return <>{children}</>;
  return <View style={styles.container}>
    <Text style={styles.title}>BeautiLyze</Text>
    {!ready && !error && <Text>Loading your profile...</Text>}
    {error ? <Text accessibilityRole="alert">{error}</Text> : null}
    {signedIn ? <Button title="Sign out" onPress={() => { void supabase.auth.signOut(); }} /> : ready && <>
      <TextInput accessibilityLabel="Email" placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} style={styles.input} />
      <TextInput accessibilityLabel="Password" placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={styles.input} />
      <Button title={busy ? 'Please wait...' : 'Sign in'} disabled={busy || !email.trim() || !password} onPress={() => { void submit(false); }} />
      <Button title="Create account" disabled={busy || !email.trim() || !password} onPress={() => { void submit(true); }} />
      <Button title="Continue with a manual profile" onPress={() => setGuest(true)} />
      {message ? <Text>{message}</Text> : null}
    </>}
  </View>;
}
const styles = StyleSheet.create({
  container: { backgroundColor: theme.colors.surface.base, flex: 1, gap: theme.spacing.lg, justifyContent: 'center', padding: theme.spacing.xl },
  input: { color: theme.colors.text.primary, fontSize: theme.typography.size.md, padding: theme.spacing.lg },
  title: { color: theme.colors.text.primary, fontSize: theme.typography.size.xxl },
});
