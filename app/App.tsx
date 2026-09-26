import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadScanImage, AnalyzeResponse } from './src/services/api';
import { supabase } from './src/lib/supabase';

export default function App() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-authenticate test user on app launch for DB sync testing
  useEffect(() => {
    async function ensureTestUserSession() {
      // First check if there's already an active session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('Existing session found, user authenticated');
        return;
      }

      // No session - try to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });

      if (signInError) {
        // Sign in failed - likely user doesn't exist, try sign up
        console.log('Sign in failed, attempting sign up:', signInError.message);
        const { error: signUpError } = await supabase.auth.signUp({
          email: 'test@example.com',
          password: 'password123',
        });
        if (signUpError) {
          console.error('Sign up failed:', signUpError.message);
        } else {
          console.log('Test user created successfully');
        }
      } else {
        console.log('Test user signed in successfully');
      }
    }
    ensureTestUserSession();
  }, []);

  const pickImage = async () => {
    setError(null);
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      alert("Permission to access camera roll is required!");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!pickerResult.canceled && pickerResult.assets[0].uri) {
      const selectedUri = pickerResult.assets[0].uri;
      setImageUri(selectedUri);
      analyzePhoto(selectedUri);
    }
  };

  const analyzePhoto = async (uri: string) => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      // 1. Fetch current session token explicitly
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      console.log("Token sent to backend:", token ? "YES (valid token)" : "NO (null)");

      // 2. Pass token to backend
      const data = await uploadScanImage({
        imageUri: uri,
        userToken: token,
      });

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>BeautiLyze AI Scan</Text>
      
      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.previewImage} />
      )}

      <TouchableOpacity style={styles.button} onPress={pickImage} disabled={loading}>
        <Text style={styles.buttonText}>{imageUri ? 'Select Another Photo' : 'Choose Photo'}</Text>
      </TouchableOpacity>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Analyzing skin scan...</Text>
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Analysis Results</Text>
          
          <View style={styles.resultRow}>
            <Text style={styles.label}>Skin Type:</Text>
            <Text style={styles.value}>
              {result.data.skin_type.label.toUpperCase()} ({Math.round(result.data.skin_type.confidence * 100)}%)
            </Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.label}>Acne Severity:</Text>
            <Text style={styles.value}>
              {result.data.acne_severity.label.toUpperCase()} ({Math.round(result.data.acne_severity.confidence * 100)}%)
            </Text>
          </View>

          <Text style={styles.dbText}>
            DB Sync: {result.db_record ? '✅ Saved to Supabase' : '⚠️ Local test mode'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  previewImage: { width: 220, height: 220, borderRadius: 16, marginBottom: 20 },
  button: { backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loadingContainer: { marginTop: 20, alignItems: 'center' },
  loadingText: { marginTop: 8, color: '#666' },
  errorText: { color: '#d9534f', marginTop: 16, textAlign: 'center' },
  resultCard: { marginTop: 24, width: '100%', backgroundColor: '#fff', padding: 16, borderRadius: 12, elevation: 2 },
  resultTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  label: { fontSize: 16, color: '#333' },
  value: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
  dbText: { marginTop: 12, fontSize: 12, color: '#888', fontStyle: 'italic' },
});