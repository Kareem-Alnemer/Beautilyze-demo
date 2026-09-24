export const typography = {
  font: {
    heading: 'Fraunces',
    body: 'Inter',
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
  },
  size: {
    xs: 12,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 22,
    xxl: 32,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
  letterSpacing: {
    uppercase: 0.08,
  },
} as const;

export type Typography = typeof typography;