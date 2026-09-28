import React from 'react';
import type { ColorValue } from 'react-native';
import { Check, TriangleAlert, X, ChevronLeft, ChevronDown, ChevronUp, Camera, Search, User, Settings, Info, House, History, SwitchCamera, Images } from 'lucide-react-native';
import { theme } from '../../theme';

const icons = {
  check: Check, 'alert-triangle': TriangleAlert, x: X, 'chevron-left': ChevronLeft,
  'chevron-down': ChevronDown, 'chevron-up': ChevronUp, camera: Camera,
  search: Search, user: User, settings: Settings, info: Info, home: House,
  history: History, 'switch-camera': SwitchCamera, images: Images,
};
export type IconName = keyof typeof icons;

// Decorative: the enclosing control or adjacent text supplies the accessible name.
export function Icon({ name, color = theme.colors.text.primary, size = 'md' }: {
  name: IconName; color?: ColorValue; size?: 'sm' | 'md' | 'lg';
}) {
  const Component = icons[name];
  const sizes = { sm: theme.spacing.lg, md: theme.spacing.xl, lg: theme.spacing.xxl };
  return <Component size={sizes[size]} color={color} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />;
}
