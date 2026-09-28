import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, TextInput, FontsReadyContext, resolveFontStyle } from '../../components/ui/Text';
import { theme } from '../../theme';

describe('bundled typography', () => {
  it.each([
    [theme.typography.font.body, 400, theme.typography.face.bodyRegular],
    [theme.typography.font.body, 500, theme.typography.face.bodyMedium],
    [theme.typography.font.body, 600, theme.typography.face.bodySemibold],
    [theme.typography.font.heading, 500, theme.typography.face.headingMedium],
    [theme.typography.font.heading, 600, theme.typography.face.headingSemibold],
  ] as const)('selects the real font face for %s weight %s', (fontFamily, fontWeight, expected) => {
    expect(resolveFontStyle({ fontFamily, fontWeight }, true).fontFamily).toBe(expected);
  });

  it('uses system fonts when assets are unavailable', () => {
    expect(resolveFontStyle({ fontFamily: theme.typography.font.heading }, false).fontFamily).toBeUndefined();
  });

  it('preserves accessible text and input props', () => {
    const screen = render(<FontsReadyContext.Provider value>
      <Text accessibilityRole="header">Profile</Text>
      <TextInput accessibilityLabel="Age" value="20" />
    </FontsReadyContext.Provider>);
    expect(screen.getByRole('header', { name: 'Profile' })).toBeTruthy();
    expect(screen.getByLabelText('Age').props.value).toBe('20');
  });
});
