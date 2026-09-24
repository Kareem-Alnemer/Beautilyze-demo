export const elevation = {
  flat: 0,
  raised: {
    shadowColor: '#1F1B18',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
} as const;

export type Elevation = typeof elevation;