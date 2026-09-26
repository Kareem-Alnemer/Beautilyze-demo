import React from 'react';
import { render } from '@testing-library/react-native';
import { HardConstraintBanner } from '../../components/HardConstraintBanner';

describe('HardConstraintBanner', () => {
  it('renders nothing when all constraints pass', () => {
    const { queryByText } = render(
      React.createElement(HardConstraintBanner, {
        hardConstraints: [
          { name: 'declared_allergen_conflict', result: 'pass', reason: '' },
          { name: 'sensitivity', result: 'pass', reason: '' },
        ],
      })
    );

    expect(queryByText('Hard constraints')).toBeNull();
    expect(queryByText('Declared-allergen conflict')).toBeNull();
  });

  it('renders allergen conflict with fail result', () => {
    const { getByText } = render(
      React.createElement(HardConstraintBanner, {
        hardConstraints: [
          { name: 'declared_allergen_conflict', result: 'fail', reason: 'Contains peanut' },
          { name: 'sensitivity', result: 'pass', reason: '' },
        ],
      })
    );

    expect(getByText('Hard constraints')).toBeTruthy();
    expect(getByText('Declared-allergen conflict')).toBeTruthy();
    expect(getByText('Mismatch')).toBeTruthy();
    expect(getByText('Contains peanut')).toBeTruthy();
  });

  it('renders allergen conflict with insufficient_data', () => {
    const { getByText } = render(
      React.createElement(HardConstraintBanner, {
        hardConstraints: [
          { name: 'declared_allergen_conflict', result: 'insufficient_data', reason: 'We couldn\'t fully verify this product\'s ingredients.' },
          { name: 'sensitivity', result: 'pass', reason: '' },
        ],
      })
    );

    expect(getByText('Declared-allergen conflict')).toBeTruthy();
    expect(getByText('Insufficient data')).toBeTruthy();
    expect(getByText('We couldn\'t fully verify this product\'s ingredients.')).toBeTruthy();
  });

  it('renders sensitivity with caution', () => {
    const { getByText } = render(
      React.createElement(HardConstraintBanner, {
        hardConstraints: [
          { name: 'declared_allergen_conflict', result: 'pass', reason: '' },
          { name: 'sensitivity', result: 'caution', reason: 'Contains fragrance' },
        ],
      })
    );

    expect(getByText('Sensitivity')).toBeTruthy();
    expect(getByText('Caution')).toBeTruthy();
    expect(getByText('Contains fragrance')).toBeTruthy();
  });

  it('renders both constraints when both flagged', () => {
    const { getByText } = render(
      React.createElement(HardConstraintBanner, {
        hardConstraints: [
          { name: 'declared_allergen_conflict', result: 'fail', reason: 'Contains peanut' },
          { name: 'sensitivity', result: 'caution', reason: 'Contains fragrance' },
        ],
      })
    );

    expect(getByText('Declared-allergen conflict')).toBeTruthy();
    expect(getByText('Sensitivity')).toBeTruthy();
    expect(getByText('Contains peanut')).toBeTruthy();
    expect(getByText('Contains fragrance')).toBeTruthy();
  });

  it('shows correct icons for each result type', () => {
    const { getAllByText } = render(
      React.createElement(HardConstraintBanner, {
        hardConstraints: [
          { name: 'declared_allergen_conflict', result: 'fail', reason: '' },
          { name: 'sensitivity', result: 'caution', reason: '' },
          { name: 'sensitivity', result: 'insufficient_data', reason: '' },
        ],
      })
    );

    // fail shows ✕, caution shows ⚠, insufficient_data shows ✕ (per component logic)
    const failIcons = getAllByText('✕');
    const cautionIcons = getAllByText('⚠');
    expect(failIcons.length).toBe(2); // fail + insufficient_data both show ✕
    expect(cautionIcons.length).toBe(1); // only caution shows ⚠
  });
});