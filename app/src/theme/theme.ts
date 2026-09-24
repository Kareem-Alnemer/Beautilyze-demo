import { colors, type Colors } from './colors';
import { typography, type Typography } from './typography';
import { spacing, type Spacing } from './spacing';
import { radii, type Radii } from './radii';
import { elevation, type Elevation } from './elevation';
import { motion, type Motion } from './motion';

export const theme = {
  colors,
  typography,
  spacing,
  radii,
  elevation,
  motion,
} as const;

export type Theme = typeof theme;
export type { Colors, Typography, Spacing, Radii, Elevation, Motion };