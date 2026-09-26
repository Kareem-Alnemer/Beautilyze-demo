/**
 * On-device persistence for the first-run onboarding flag.
 *
 * `hasCompletedOnboarding` is device state, not profile data: it never goes
 * to Supabase (there is no column for it), so it lives in AsyncStorage.
 * Storage access is lazy and failure-tolerant: if the native module is
 * missing (Jest) or a read/write throws, we fall back to an in-memory
 * value or `false`, which at worst repeats onboarding once.
 */

const STORAGE_KEY = 'beautilyze.hasCompletedOnboarding';

let memoryFallback = false;

interface FlagStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
}

function getStorage(): FlagStorage | null {
  try {
    // Lazy require keeps this module importable without native storage
    // (unit tests, web). The package is already a project dependency.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@react-native-async-storage/async-storage');
    return (mod.default ?? mod) as FlagStorage;
  } catch {
    return null;
  }
}

export async function loadOnboardingFlag(): Promise<boolean> {
  const storage = getStorage();
  if (!storage) return memoryFallback;
  try {
    return (await storage.getItem(STORAGE_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function saveOnboardingFlag(value: boolean): Promise<void> {
  memoryFallback = value;
  const storage = getStorage();
  if (!storage) return;
  try {
    await storage.setItem(STORAGE_KEY, value ? '1' : '0');
  } catch {
    // Device keeps the in-memory value for this session; next launch
    // repeats onboarding. Never throws into the completion flow.
  }
}
