export const motion = {
  reveal: {
    duration: 300,
    easing: 'ease-out' as const,
  },
  follow: {
    delay: 100,
  },
} as const;

export type Motion = typeof motion;