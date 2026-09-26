import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useProfileStore } from '../profile/store';

/**
 * First-run gate (blueprint §4.2). Mounted inside AuthGate so it only
 * runs for signed-in or guest users. Redirects to /onboarding until the
 * device-local completion flag is set, and back to / afterwards.
 * Returns nothing; navigation only.
 */
export function OnboardingGate() {
  const router = useRouter();
  const segments = useSegments();
  const done = useProfileStore((s) => s.hasCompletedOnboarding);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;
    void useProfileStore
      .getState()
      .loadOnboardingStatus()
      .finally(() => {
        if (live) setReady(true);
      });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const here = segments[0];
    if (!done && here !== 'onboarding') router.replace('/onboarding');
    else if (done && here === 'onboarding') router.replace('/');
  }, [ready, done, segments, router]);

  return null;
}
