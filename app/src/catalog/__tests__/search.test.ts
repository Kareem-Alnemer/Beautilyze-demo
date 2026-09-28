import { searchProducts } from '../api';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({ supabase: { from: jest.fn() } }));

describe('catalog search filters', () => {
  const request = { select: jest.fn(), or: jest.fn(), contains: jest.fn(), order: jest.fn(), limit: jest.fn() };
  beforeEach(() => {
    jest.clearAllMocks();
    for (const method of [request.select, request.or, request.contains, request.order]) method.mockReturnValue(request);
    request.limit.mockResolvedValue({ data: [], error: null });
    (supabase.from as jest.Mock).mockReturnValue(request);
  });

  it('does not browse the full catalog for empty text and no filters', async () => {
    await expect(searchProducts(' ')).resolves.toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('allows filter-only browsing without a name condition', async () => {
    await searchProducts('', { skinType: 'dry', concern: 'hydration' });
    expect(request.or).not.toHaveBeenCalled();
    expect(request.contains.mock.calls).toEqual([
      ['skin_type_tags', ['dry']], ['concern_tags', ['hydration']],
    ]);
    expect(request.contains.mock.invocationCallOrder[1]).toBeLessThan(request.limit.mock.invocationCallOrder[0]);
  });

  it('removes query syntax and wildcard characters from text', async () => {
    await searchProducts('a%,_()\\b');
    expect(request.or).toHaveBeenCalledWith('name.ilike.%a      b%,brand.ilike.%a      b%');
  });

  it('does not turn punctuation-only text into a catalog-wide query', async () => {
    await searchProducts('%,_()\\');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('returns ingredient availability with each result', async () => {
    const rows = [{ id: 'p', partial_data: true, ingredients_raw: null }];
    request.limit.mockResolvedValue({ data: rows, error: null });
    await expect(searchProducts('cleanser')).resolves.toEqual(rows);
    expect(request.select).toHaveBeenCalledWith(expect.stringContaining('partial_data, ingredients_raw'));
  });

  it('reports offline failure rather than returning no matches', async () => {
    request.limit.mockResolvedValue({ data: null, error: { message: 'offline' } });
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    try { await expect(searchProducts('', { concern: 'acne' })).rejects.toThrow('Failed to search products'); }
    finally { log.mockRestore(); }
  });
});
