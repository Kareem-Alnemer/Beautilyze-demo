import React from 'react';
import { SkinType } from '../../verdict/types';
import { ChoiceField } from '../../components/ui/ChoiceField';

interface SkinTypeSelectorProps {
  value: SkinType | null;
  onChange: (type: SkinType | null) => void;
  label?: string;
  disabled?: boolean;
}

const SKIN_TYPES: { value: SkinType; label: string; description: string }[] = [
  { value: 'dry', label: 'Dry', description: 'Tight, flaky, rough' },
  { value: 'normal', label: 'Normal', description: 'Balanced, comfortable' },
  { value: 'oily', label: 'Oily', description: 'Shiny, enlarged pores' },
];

export const SkinTypeSelector: React.FC<SkinTypeSelectorProps> = ({ label = 'Skin Type', ...props }) => (
  <ChoiceField label={label} options={SKIN_TYPES} {...props} />
);
