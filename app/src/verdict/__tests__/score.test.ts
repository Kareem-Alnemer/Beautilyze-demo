import { computeScore } from '../score';
import { FactorState } from '../types';

describe('computeScore', () => {
  it('returns 3 passed when all factors pass', () => {
    const factors: FactorState[] = ['pass', 'pass', 'pass'];
    const result = computeScore(factors);
    expect(result).toEqual({
      label: 'Compatibility factors',
      passed: 3,
      total: 3,
    });
  });

  it('returns 2 passed when two factors pass', () => {
    const factors: FactorState[] = ['pass', 'pass', 'fail'];
    const result = computeScore(factors);
    expect(result).toEqual({
      label: 'Compatibility factors',
      passed: 2,
      total: 3,
    });
  });

  it('returns 2 passed when two factors pass (different order)', () => {
    const factors: FactorState[] = ['pass', 'fail', 'pass'];
    const result = computeScore(factors);
    expect(result).toEqual({
      label: 'Compatibility factors',
      passed: 2,
      total: 3,
    });
  });

  it('returns 1 passed when one factor passes', () => {
    const factors: FactorState[] = ['pass', 'fail', 'fail'];
    const result = computeScore(factors);
    expect(result).toEqual({
      label: 'Compatibility factors',
      passed: 1,
      total: 3,
    });
  });

  it('returns 0 passed when no factors pass', () => {
    const factors: FactorState[] = ['fail', 'fail', 'fail'];
    const result = computeScore(factors);
    expect(result).toEqual({
      label: 'Compatibility factors',
      passed: 0,
      total: 3,
    });
  });

  it('returns 0 passed when factors are caution', () => {
    const factors: FactorState[] = ['caution', 'caution', 'caution'];
    const result = computeScore(factors);
    expect(result).toEqual({
      label: 'Compatibility factors',
      passed: 0,
      total: 3,
    });
  });

  it('returns 0 passed when factors are insufficient_data', () => {
    const factors: FactorState[] = ['insufficient_data', 'insufficient_data', 'insufficient_data'];
    const result = computeScore(factors);
    expect(result).toEqual({
      label: 'Compatibility factors',
      passed: 0,
      total: 3,
    });
  });

  it('returns 1 passed with mixed states (pass, caution, insufficient)', () => {
    const factors: FactorState[] = ['pass', 'caution', 'insufficient_data'];
    const result = computeScore(factors);
    expect(result).toEqual({
      label: 'Compatibility factors',
      passed: 1,
      total: 3,
    });
  });

  it('returns 2 passed with mixed states (pass, pass, caution)', () => {
    const factors: FactorState[] = ['pass', 'pass', 'caution'];
    const result = computeScore(factors);
    expect(result).toEqual({
      label: 'Compatibility factors',
      passed: 2,
      total: 3,
    });
  });

  it('throws error when not exactly 3 factors provided', () => {
    expect(() => computeScore(['pass', 'pass'])).toThrow('Expected exactly 3 compatibility factors');
    expect(() => computeScore(['pass', 'pass', 'pass', 'pass'])).toThrow('Expected exactly 3 compatibility factors');
    expect(() => computeScore([])).toThrow('Expected exactly 3 compatibility factors');
  });

  it('returns correct type structure', () => {
    const factors: FactorState[] = ['pass', 'fail', 'pass'];
    const result = computeScore(factors);
    expect(result).toHaveProperty('label', 'Compatibility factors');
    expect(result).toHaveProperty('passed', 2);
    expect(result).toHaveProperty('total', 3);
    expect(typeof result.passed).toBe('number');
    expect(typeof result.total).toBe('number');
  });
});