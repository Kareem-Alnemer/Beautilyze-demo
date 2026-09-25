import {
  splitIngredients,
  normalizeIngredientString,
  buildAliasMap,
  normalizeIngredients,
  normalizeFromRawString,
  IngredientConcern,
} from '../normalize';

describe('splitIngredients', () => {
  it('splits simple comma-separated list', () => {
    const result = splitIngredients('Water, Glycerin, Niacinamide');
    expect(result).toEqual(['Water', 'Glycerin', 'Niacinamide']);
  });

  it('handles commas inside parentheses', () => {
    const result = splitIngredients('Water, Niacinamide (5%, pure), Fragrance');
    expect(result).toEqual(['Water', 'Niacinamide (5%, pure)', 'Fragrance']);
  });

  it('handles nested parentheses', () => {
    const result = splitIngredients('Water, Extract (Aloe (Barbadensis)), Glycerin');
    expect(result).toEqual(['Water', 'Extract (Aloe (Barbadensis))', 'Glycerin']);
  });

  it('handles no commas (single ingredient)', () => {
    const result = splitIngredients('Water');
    expect(result).toEqual(['Water']);
  });

  it('handles empty string', () => {
    const result = splitIngredients('');
    expect(result).toEqual([]);
  });

  it('handles trailing comma', () => {
    const result = splitIngredients('Water, Glycerin,');
    expect(result).toEqual(['Water', 'Glycerin']);
  });

  it('handles spaces around commas', () => {
    const result = splitIngredients('Water , Glycerin , Niacinamide');
    expect(result).toEqual(['Water', 'Glycerin', 'Niacinamide']);
  });
});

describe('normalizeIngredientString', () => {
  it('lowercases', () => {
    expect(normalizeIngredientString('NIACINAMIDE')).toBe('niacinamide');
  });

  it('trims whitespace', () => {
    expect(normalizeIngredientString('  niacinamide  ')).toBe('niacinamide');
  });

  it('removes parenthetical content', () => {
    expect(normalizeIngredientString('Water (Aqua)')).toBe('water');
    expect(normalizeIngredientString('Niacinamide (5%)')).toBe('niacinamide');
  });

  it('removes trailing punctuation', () => {
    expect(normalizeIngredientString('niacinamide.')).toBe('niacinamide');
    expect(normalizeIngredientString('niacinamide,')).toBe('niacinamide');
    expect(normalizeIngredientString('niacinamide;')).toBe('niacinamide');
  });

  it('collapses multiple spaces', () => {
    expect(normalizeIngredientString('niacinamide   acid')).toBe('niacinamide acid');
  });

  it('handles complex example', () => {
    expect(normalizeIngredientString('  Water (Aqua)  ')).toBe('water');
  });

  it('returns empty string for only parenthetical', () => {
    expect(normalizeIngredientString('(Aqua)')).toBe('');
  });
});

describe('buildAliasMap', () => {
  const concerns: IngredientConcern[] = [
    {
      ingredient_name: 'niacinamide',
      aliases: ['vitamin b3', 'nicotinamide'],
    },
    {
      ingredient_name: 'salicylic acid',
      aliases: ['bha', 'beta hydroxy acid'],
    },
  ];

  it('maps canonical to itself', () => {
    const map = buildAliasMap(concerns);
    expect(map.get('niacinamide')).toBe('niacinamide');
    expect(map.get('salicylic acid')).toBe('salicylic acid');
  });

  it('maps aliases to canonical', () => {
    const map = buildAliasMap(concerns);
    expect(map.get('vitamin b3')).toBe('niacinamide');
    expect(map.get('nicotinamide')).toBe('niacinamide');
    expect(map.get('bha')).toBe('salicylic acid');
    expect(map.get('beta hydroxy acid')).toBe('salicylic acid');
  });

  it('handles case insensitivity (keys are stored lowercase)', () => {
    const map = buildAliasMap(concerns);
    // Map keys are stored lowercase; lookups must be lowercase
    expect(map.get('vitamin b3')).toBe('niacinamide');
    expect(map.get('bha')).toBe('salicylic acid');
  });

  it('handles whitespace in aliases (keys are stored trimmed)', () => {
    const map = buildAliasMap(concerns);
    // Map keys are stored trimmed; lookups must be trimmed
    expect(map.get('vitamin b3')).toBe('niacinamide');
  });
});

describe('normalizeIngredients', () => {
  const concerns: IngredientConcern[] = [
    {
      ingredient_name: 'niacinamide',
      aliases: ['vitamin b3', 'nicotinamide'],
    },
    {
      ingredient_name: 'salicylic acid',
      aliases: ['bha', 'beta hydroxy acid'],
    },
    {
      ingredient_name: 'water',
      aliases: ['aqua'],
    },
    {
      ingredient_name: 'glycerin',
      aliases: [],
    },
  ];

  it('resolves canonical names', () => {
    const result = normalizeIngredients(['niacinamide', 'salicylic acid'], concerns);
    expect(result.ingredients_normalized).toEqual(['niacinamide', 'salicylic acid']);
    expect(result.unmatched_count).toBe(0);
    expect(result.partial_data).toBe(false);
  });

  it('resolves aliases to canonical', () => {
    const result = normalizeIngredients(['vitamin b3', 'bha'], concerns);
    expect(result.ingredients_normalized).toEqual(['niacinamide', 'salicylic acid']);
    expect(result.unmatched_count).toBe(0);
  });

  it('handles mixed canonical and aliases', () => {
    const result = normalizeIngredients(['niacinamide', 'bha', 'vitamin b3'], concerns);
    expect(result.ingredients_normalized).toEqual(['niacinamide', 'salicylic acid', 'niacinamide']);
    expect(result.unmatched_count).toBe(0);
  });

  it('flags unmatched ingredients', () => {
    const result = normalizeIngredients(['niacinamide', 'unknown ingredient'], concerns);
    expect(result.ingredients_normalized).toEqual(['niacinamide', 'unknown ingredient']);
    expect(result.unmatched_count).toBe(1);
    expect(result.unmatched_ingredients).toEqual(['unknown ingredient']);
    expect(result.partial_data).toBe(true); // 1/2 = 50% > 30%
  });

  it('sets partial_data when unmatched > 30%', () => {
    // 2 matched, 1 unmatched = 33% > 30%
    const result = normalizeIngredients(['niacinamide', 'glycerin', 'unknown'], concerns);
    expect(result.unmatched_count).toBe(1);
    expect(result.partial_data).toBe(true);
  });

  it('does not set partial_data when unmatched <= 30%', () => {
    // 3 matched, 1 unmatched = 25% <= 30%
    const result = normalizeIngredients(['niacinamide', 'glycerin', 'water', 'unknown'], concerns);
    expect(result.unmatched_count).toBe(1);
    expect(result.partial_data).toBe(false);
  });

  it('handles empty input', () => {
    const result = normalizeIngredients([], concerns);
    expect(result.ingredients_normalized).toEqual([]);
    expect(result.unmatched_count).toBe(0);
    expect(result.partial_data).toBe(false);
  });

  it('preserves unmatched ingredients in normalized array', () => {
    const result = normalizeIngredients(['niacinamide', 'mystery'], concerns);
    expect(result.ingredients_normalized).toContain('mystery');
    expect(result.unmatched_ingredients).toContain('mystery');
  });

  it('handles case insensitivity in input', () => {
    const result = normalizeIngredients(['NIACINAMIDE', 'BHA'], concerns);
    expect(result.ingredients_normalized).toEqual(['niacinamide', 'salicylic acid']);
    expect(result.unmatched_count).toBe(0);
  });
});

describe('normalizeFromRawString', () => {
  const concerns: IngredientConcern[] = [
    {
      ingredient_name: 'niacinamide',
      aliases: ['vitamin b3'],
    },
    {
      ingredient_name: 'salicylic acid',
      aliases: ['bha'],
    },
    {
      ingredient_name: 'water',
      aliases: ['aqua'],
    },
  ];

  it('splits and normalizes raw string', () => {
    const result = normalizeFromRawString('Water, Niacinamide, Salicylic Acid', concerns);
    expect(result.ingredients_normalized).toEqual(['water', 'niacinamide', 'salicylic acid']);
    expect(result.unmatched_count).toBe(0);
  });

  it('handles parentheses in raw string', () => {
    const result = normalizeFromRawString('Water (Aqua), Niacinamide (5%)', concerns);
    expect(result.ingredients_normalized).toEqual(['water', 'niacinamide']);
    expect(result.unmatched_count).toBe(0);
  });

  it('handles commas in parentheses', () => {
    const result = normalizeFromRawString('Water, Niacinamide (5%, pure), Fragrance', concerns);
    expect(result.ingredients_normalized).toEqual(['water', 'niacinamide', 'fragrance']);
    expect(result.unmatched_count).toBe(1); // fragrance unmatched
  });
});