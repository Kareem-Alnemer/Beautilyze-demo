export const colors = {
  brand: {
    accent: '#E85A4F',
    paper: '#FBF7F2',
    ink: '#1F1B18',
  },
  text: {
    primary: '#1F1B18',
    secondary: '#6B6259',
    tertiary: '#9A9088',
    onAccent: '#FFFFFF',
  },
  surface: {
    base: '#FBF7F2',
    raised: '#FFFFFF',
    rule: '#1F1B1810',
  },
  verdict: {
    match: '#3D8B5F',
    caution: '#D98C2B',
    mismatch: '#C43F3B',
    neutral: '#6B6259',
  },
} as const;

export type Colors = typeof colors;