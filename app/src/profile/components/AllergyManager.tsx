import React from 'react';
import { ChipManager } from './ChipManager';

const COMMON_ALLERGENS = [
  'peanut',
  'tree nuts',
  'shellfish',
  'fish',
  'milk',
  'eggs',
  'soy',
  'wheat',
  'sesame',
  'gluten',
  'fragrance',
  'parabens',
  'formaldehyde',
  'nickel',
  'lanolin',
];

export const AllergyManager: React.FC<{
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (item: string) => void;
  disabled?: boolean;
}> = ({ items, onAdd, onRemove, disabled }) => (
  <ChipManager
    items={items}
    onAdd={onAdd}
    onRemove={onRemove}
    label="Allergies"
    placeholder="Add allergy (e.g., peanut, fragrance)"
    suggestions={COMMON_ALLERGENS}
    disabled={disabled}
  />
);