import React from 'react';
import { Text } from 'react-native';
import { act, render, waitFor, fireEvent } from '@testing-library/react-native';
import { AuthGate } from '../AuthGate';

const mockLoad = jest.fn();
const mockSetUserId = jest.fn();
const mockUnsubscribe = jest.fn();
let mockCallback: (event: string, session: { user: { id: string } } | null) => void;
const mockGetSession = jest.fn();
const mockSignIn = jest.fn();
jest.mock('../../lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: { auth: {
    getSession: () => mockGetSession(),
    signInWithPassword: (credentials: unknown) => mockSignIn(credentials),
    onAuthStateChange: (callback: typeof mockCallback) => {
      mockCallback = callback;
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
    },
  } },
}));
jest.mock('../../profile/store', () => ({
  useProfileStore: { getState: () => ({ setUserId: mockSetUserId, loadProfile: mockLoad }) },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'owner' } } }, error: null });
  mockLoad.mockResolvedValue(undefined);
  mockSignIn.mockResolvedValue({ data: { session: null }, error: null });
});

it('does not reload and overwrite a draft on a same-account token refresh', async () => {
  const screen = render(<AuthGate><Text>Application</Text></AuthGate>);
  await screen.findByText('Application');
  await act(async () => {
    mockCallback('TOKEN_REFRESHED', { user: { id: 'owner' } });
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  expect(mockLoad).toHaveBeenCalledTimes(1);
});

it('loads the new profile when the account changes', async () => {
  const screen = render(<AuthGate><Text>Application</Text></AuthGate>);
  await screen.findByText('Application');
  act(() => mockCallback('SIGNED_IN', { user: { id: 'other' } }));
  await waitFor(() => expect(mockLoad).toHaveBeenLastCalledWith('other'));
});

it('cancels scheduled auth work when the gate unmounts', async () => {
  const screen = render(<AuthGate><Text>Application</Text></AuthGate>);
  await screen.findByText('Application');
  act(() => mockCallback('SIGNED_IN', { user: { id: 'other' } }));
  screen.unmount();
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 10)); });
  expect(mockLoad).toHaveBeenCalledTimes(1);
  expect(mockUnsubscribe).toHaveBeenCalled();
});

it('shows a recoverable session restoration error when the request rejects', async () => {
  mockGetSession.mockRejectedValueOnce(new Error('offline'));
  const screen = render(<AuthGate><Text>Application</Text></AuthGate>);
  expect(await screen.findByText('Could not restore your session')).toBeTruthy();
});

it('shows labeled form inputs and disables an empty sign-in command', async () => {
  mockGetSession.mockResolvedValueOnce({ data: { session: null }, error: null });
  const screen = render(<AuthGate><Text>Application</Text></AuthGate>);
  await screen.findByLabelText('Email');
  expect(screen.getByLabelText('Password')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Sign in' }).props.accessibilityState.disabled).toBe(true);
});

it('submits entered credentials without losing the visible form labels', async () => {
  mockGetSession.mockResolvedValueOnce({ data: { session: null }, error: null });
  const screen = render(<AuthGate><Text>Application</Text></AuthGate>);
  fireEvent.changeText(await screen.findByLabelText('Email'), ' student@example.com ');
  fireEvent.changeText(screen.getByLabelText('Password'), 'example-password');
  fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith({ email: 'student@example.com', password: 'example-password' }));
  expect(screen.getByText('Email')).toBeTruthy();
});

it('retries a failed profile load', async () => {
  mockLoad.mockRejectedValueOnce(new Error('offline'));
  const screen = render(<AuthGate><Text>Application</Text></AuthGate>);
  fireEvent.press(await screen.findByRole('button', { name: 'Retry profile' }));
  expect(await screen.findByText('Application')).toBeTruthy();
  expect(mockLoad).toHaveBeenCalledTimes(2);
});
