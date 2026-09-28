import { theme } from '../theme';

const expectedTheme = {
  colors: {
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
      transparent: 'transparent',
      scrim: 'rgba(0,0,0,0.5)',
    },
    verdict: {
      match: '#3D8B5F',
      caution: '#D98C2B',
      mismatch: '#C43F3B',
      neutral: '#6B6259',
    },
    badge: {
      skinType: '#007AFF',
      acneClear: '#43a047',
      acneMild: '#f9a825',
      acneModerate: '#e53935',
      acneSevere: '#e53935',
    },
  },
  typography: {
    face: {
      headingMedium: 'Fraunces_500Medium',
      headingSemibold: 'Fraunces_600SemiBold',
      bodyRegular: 'Inter_400Regular',
      bodyMedium: 'Inter_500Medium',
      bodySemibold: 'Inter_600SemiBold',
    },
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
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },
  radii: {
    none: 0,
    sm: 2,
    md: 4,
  },
  elevation: {
    flat: 0,
    raised: {
      shadowColor: '#1F1B18',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 1,
    },
  },
  motion: {
    reveal: {
      duration: 300,
      easing: 'ease-out',
    },
    follow: {
      delay: 100,
    },
  },
};

function collectColorValues(obj: unknown, path = ''): string[] {
  const colors: string[] = [];
  if (obj === null || typeof obj !== 'object') return colors;

  if (Array.isArray(obj)) {
    obj.forEach((item: string, i) => {
      colors.push(...collectColorValues(item, `${path}[${i}]`));
    });
  } else {
    for (const [key, value] of Object.entries(obj)) {
      const newPath = path ? `${path}.${key}` : key;
      if (typeof value === 'string' && value.startsWith('#')) {
        colors.push(value);
      } else if (typeof value === 'object' && value !== null) {
        colors.push(...collectColorValues(value, newPath));
      }
    }
  }
  return colors;
}

function isValidHex(color: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(color);
}

describe('theme tokens', () => {
  test('theme matches expected token set exactly', () => {
    expect(theme).toEqual(expectedTheme);
  });

  test('all color values are valid hex strings', () => {
    const allColors = collectColorValues(theme);
    const invalid = allColors.filter((c) => !isValidHex(c));
    expect(invalid).toHaveLength(0);
  });
});
