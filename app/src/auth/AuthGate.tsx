import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput } from '../components/ui/Text';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useProfileStore } from '../profile/store';
import { theme } from '../theme';
import { Button } from '../components/ui/Button';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [attempt, setAttempt] = useState(0);
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
    let alive = true;
    let loadedId: string | null | undefined;
    let pending: ReturnType<typeof setTimeout> | undefined;
    const load = async (id: string | null) => {
      if (!alive || loadedId === id) return;
      loadedId = id;
      const request = ++current;
      setReady(false);
      setError('');
      setSignedIn(Boolean(id));
      useProfileStore.getState().setUserId(id);
      try {
        if (id) await useProfileStore.getState().loadProfile(id);
        if (request === current) setReady(true);
      } catch {
        if (request === current) setError('Your profile could not be loaded. Please try again.');
      }
    };
    if (!isSupabaseConfigured) return;
    let authChanged = false;
    const restoreFailed = () => {
      if (!alive || authChanged) return;
      setError('Could not restore your session');
      setReady(true);
    };
    void supabase.auth.getSession().then(({ data, error: cause }) => {
      if (!alive || authChanged) return;
      if (cause) restoreFailed();
      else void load(data.session?.user.id ?? null);
    }).catch(restoreFailed);
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      authChanged = true;
      if (pending) clearTimeout(pending);
      // Start database work after the auth callback releases its internal lock.
      pending = setTimeout(() => { void load(session?.user.id ?? null); }, 0);
    });
    return () => {
      alive = false;
      current++;
      if (pending) clearTimeout(pending);
      data.subscription.unsubscribe();
    };
  }, [attempt]);
  const submit = async (register: boolean) => {
    if (busy || !email.trim() || !password) return;
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
  if ((ready && signedIn) || (guest && !signedIn)) return <>{children}</>;
  return <SafeAreaView style={styles.container}>
    <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text accessibilityRole="header" style={styles.title}>BeautiLyze</Text>
        {!isSupabaseConfigured ? <Text style={styles.body}>Account services are not configured for this build.</Text> : <>
          <Text style={styles.subtitle}>{signedIn ? 'Your account' : 'Sign in'}</Text>
          {!ready && !error && <Text accessibilityLiveRegion="polite" style={styles.body}>Loading your profile...</Text>}
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          {signedIn ? <View style={styles.actions}>
            {error && <Button title="Retry profile" onPress={() => setAttempt((value) => value + 1)} />}
            <Button title="Sign out" variant="text" onPress={() => { void supabase.auth.signOut(); }} />
          </View> : ready && <>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput accessibilityLabel="Email" placeholder="you@example.com" autoCapitalize="none"
                autoCorrect={false} autoComplete="email" keyboardType="email-address" editable={!busy}
                value={email} onChangeText={setEmail} style={styles.input} />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput accessibilityLabel="Password" placeholder="Password" secureTextEntry
                autoCapitalize="none" autoCorrect={false} autoComplete="current-password" editable={!busy}
                returnKeyType="go" onSubmitEditing={() => { void submit(false); }}
                value={password} onChangeText={setPassword} style={styles.input} />
            </View>
            <View style={styles.actions}>
              <Button title={busy ? 'Please wait...' : 'Sign in'} busy={busy}
                disabled={!email.trim() || !password} onPress={() => { void submit(false); }} />
              <Button title="Create account" variant="text" disabled={busy || !email.trim() || !password}
                onPress={() => { void submit(true); }} />
            </View>
            {message ? <Text accessibilityLiveRegion="polite" style={styles.body}>{message}</Text> : null}
            <View style={styles.guest}>
              <Button title="Continue with a manual profile" variant="text" disabled={busy} onPress={() => setGuest(true)} />
            </View>
          </>}
        </>}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  actions: { gap: theme.spacing.sm, marginTop: theme.spacing.md },
  body: {
    color: theme.colors.text.secondary, fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md, lineHeight: theme.typography.size.md * theme.typography.lineHeight.normal,
  },
  container: { backgroundColor: theme.colors.surface.base, flex: 1 },
  content: { flexGrow: 1, gap: theme.spacing.lg, justifyContent: 'center', padding: theme.spacing.xl },
  error: { color: theme.colors.verdict.mismatch, fontFamily: theme.typography.font.body, fontSize: theme.typography.size.md },
  field: { gap: theme.spacing.sm },
  guest: { borderTopColor: theme.colors.surface.rule, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: theme.spacing.lg },
  input: {
    backgroundColor: theme.colors.surface.raised, borderColor: theme.colors.surface.rule,
    borderRadius: theme.radii.md, borderWidth: StyleSheet.hairlineWidth,
    color: theme.colors.text.primary, fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md, minHeight: theme.spacing.xxxl, padding: theme.spacing.lg,
  },
  keyboard: { flex: 1 },
  label: { color: theme.colors.text.primary, fontFamily: theme.typography.font.body, fontSize: theme.typography.size.md },
  subtitle: { color: theme.colors.text.secondary, fontFamily: theme.typography.font.heading, fontSize: theme.typography.size.xl },
  title: {
    color: theme.colors.text.primary, fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.xxl, fontWeight: theme.typography.weight.semibold,
  },
});
