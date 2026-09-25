import React from 'react';
import { ChipManager } from './ChipManager';

const COMMON_SENSITIVITIES = [
  'fragrance',
  'essential oils',
  'alcohol',
  'sulfates',
  'parabens',
  'formaldehyde',
  'phthalates',
  'dyes',
  'preservatives',
  'retinoids',
  'acids',
  'vitamin c',
  'niacinamide',
  'benzoyl peroxide',
  'salicylic acid',
];

export const SensitivityManager: React.FC<{
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (item: string) => void;
  disabled?: boolean;
}> = ({ items, onAdd, onRemove, disabled }) => (
  <ChipManager
    items={items}
    onAdd={onAdd}
    onRemove={onRemove}
    label="Sensitivities"
    placeholder="Add sensitivity (e.g., fragrance, alcohol)"
    suggestions={COMMON_SENSITIVITIES}
    disabled={disabled}
  />
);