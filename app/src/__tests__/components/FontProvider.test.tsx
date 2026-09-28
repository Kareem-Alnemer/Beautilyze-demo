import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import { useFonts } from 'expo-font';
import { FontProvider } from '../../components/ui/FontProvider';
import { Text } from '../../components/ui/Text';
import { theme } from '../../theme';

jest.mock('expo-font', () => ({ useFonts: jest.fn() }));
jest.mock('../../assets/fonts', () => ({ bundledFonts: {} }));

describe('font loading boundary', () => {
  it('keeps content available while font assets load', () => {
    (useFonts as jest.Mock).mockReturnValue([false, null]);
    const screen = render(<FontProvider><Text>Content</Text></FontProvider>);
    expect(StyleSheet.flatten(screen.getByText('Content').props.style).fontFamily).toBeUndefined();
  });

  it('uses the bundled face after successful loading', () => {
    (useFonts as jest.Mock).mockReturnValue([true, null]);
    const screen = render(<FontProvider><Text>Content</Text></FontProvider>);
    expect(StyleSheet.flatten(screen.getByText('Content').props.style).fontFamily).toBe(theme.typography.face.bodyRegular);
  });

  it('falls back without logging asset error details or hiding content', () => {
    (useFonts as jest.Mock).mockReturnValue([false, new Error('private error details')]);
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const screen = render(<FontProvider><Text>Content</Text></FontProvider>);
      expect(screen.getByText('Content')).toBeTruthy();
      expect(warn).toHaveBeenCalledWith('Bundled fonts could not load; using system fonts.');
    } finally { warn.mockRestore(); }
  });
});
