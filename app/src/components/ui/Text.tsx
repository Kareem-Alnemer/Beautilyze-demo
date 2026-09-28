import React, { createContext, forwardRef, useContext } from 'react';
import { Text as NativeText, TextInput as NativeTextInput, StyleSheet, TextProps, TextInputProps, TextStyle, StyleProp } from 'react-native';
import { theme } from '../../theme';

export const FontsReadyContext = createContext(false);

export function resolveFontStyle(style: StyleProp<TextStyle>, ready: boolean): TextStyle {
  const flat = StyleSheet.flatten(style) ?? {};
  const heading = flat.fontFamily === theme.typography.font.heading;
  const weight = Number(flat.fontWeight ?? theme.typography.weight.regular);
  const face = heading
    ? (weight >= theme.typography.weight.semibold ? theme.typography.face.headingSemibold : theme.typography.face.headingMedium)
    : (weight >= theme.typography.weight.semibold ? theme.typography.face.bodySemibold
      : weight >= theme.typography.weight.medium ? theme.typography.face.bodyMedium : theme.typography.face.bodyRegular);
  return { fontFamily: ready ? face : undefined, fontWeight: ready ? theme.typography.weight.regular : flat.fontWeight, letterSpacing: 0 };
}

export const Text = forwardRef<NativeText, TextProps>(function Text({ style, ...props }, ref) {
  const ready = useContext(FontsReadyContext);
  return <NativeText ref={ref} {...props} style={[style, resolveFontStyle(style, ready)]} />;
});

export const TextInput = forwardRef<NativeTextInput, TextInputProps>(function TextInput({ style, ...props }, ref) {
  const ready = useContext(FontsReadyContext);
  return <NativeTextInput ref={ref} {...props} style={[style, resolveFontStyle(style, ready)]} />;
});
