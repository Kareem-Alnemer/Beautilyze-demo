import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SkinTypeSelector } from '../components/SkinTypeSelector';
import { AcneSeveritySelector } from '../components/AcneSeveritySelector';
import { AgeInput } from '../components/AgeInput';
import { Button } from '../../components/ui/Button';
import { ChipManager } from '../components/ChipManager';

it('marks only the selected skin type as checked', () => {
  const screen = render(<SkinTypeSelector value="oily" onChange={jest.fn()} />);
  expect(screen.getAllByRole('radio', { checked: true })).toHaveLength(1);
  expect(screen.getByRole('radio', { checked: true }).props.accessibilityLabel).toContain('Oily');
});

it('reports the acne option the user actually selects', () => {
  const change = jest.fn();
  const screen = render(<AcneSeveritySelector value={null} onChange={change} />);
  fireEvent.press(screen.getByRole('radio', { name: /Moderate/ }));
  expect(change).toHaveBeenCalledWith('moderate');
});

it('does not change a disabled choice', () => {
  const change = jest.fn();
  const screen = render(<SkinTypeSelector value="dry" onChange={change} disabled />);
  fireEvent.press(screen.getByRole('radio', { name: /Oily/ }));
  expect(change).not.toHaveBeenCalled();
});

it('announces busy buttons and blocks duplicate actions', () => {
  const press = jest.fn();
  const screen = render(<Button title="Saving..." onPress={press} busy />);
  const button = screen.getByRole('button', { name: 'Saving...' });
  fireEvent.press(button);
  expect(button.props.accessibilityState.busy).toBe(true);
  expect(press).not.toHaveBeenCalled();
});

it('does not commit a fractional age', () => {
  const change = jest.fn();
  const screen = render(<AgeInput value={20} onChange={change} />);
  fireEvent.changeText(screen.getByLabelText('Age'), '20.5');
  expect(change).not.toHaveBeenCalled();
  expect(screen.getByRole('alert')).toBeTruthy();
});

it('clears age when the field is emptied', () => {
  const change = jest.fn();
  const screen = render(<AgeInput value={20} onChange={change} />);
  fireEvent.changeText(screen.getByLabelText('Age'), '');
  expect(change).toHaveBeenCalledWith(null);
});

it('normalizes added values and keeps an existing differently cased value unique', () => {
  const add = jest.fn();
  const screen = render(<ChipManager label="Allergies" placeholder="Add allergy" items={['fragrance']} onAdd={add} onRemove={jest.fn()} />);
  fireEvent.changeText(screen.getByLabelText('Allergies'), ' Fragrance ');
  fireEvent.press(screen.getByRole('button', { name: 'Add to allergies' }));
  expect(add).not.toHaveBeenCalled();
});

it('adds a suggested ingredient in one press', () => {
  const add = jest.fn();
  const screen = render(<ChipManager label="Allergies" placeholder="Add allergy" items={[]} suggestions={['fragrance']} onAdd={add} onRemove={jest.fn()} />);
  fireEvent.changeText(screen.getByLabelText('Allergies'), 'fra');
  fireEvent.press(screen.getByRole('button', { name: 'Add fragrance' }));
  expect(add).toHaveBeenCalledWith('fragrance');
  expect(screen.getByLabelText('Allergies').props.value).toBe('');
});
