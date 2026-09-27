import React from 'react';
import { AcneSeverity } from '../../verdict/types';
import { ChoiceField } from '../../components/ui/ChoiceField';

interface AcneSeveritySelectorProps {
  value: AcneSeverity | null;
  onChange: (severity: AcneSeverity | null) => void;
  label?: string;
  disabled?: boolean;
}

const ACNE_SEVERITIES: { value: AcneSeverity; label: string; description: string }[] = [
  { value: 'mild', label: 'Mild', description: 'Occasional breakouts' },
  { value: 'moderate', label: 'Moderate', description: 'Regular breakouts, some inflammation' },
  { value: 'severe', label: 'Severe', description: 'Widespread, painful, cystic' },
];

export const AcneSeveritySelector: React.FC<AcneSeveritySelectorProps> = ({ label = 'Acne Severity', ...props }) => (
  <ChoiceField label={label} options={ACNE_SEVERITIES} {...props} />
);
