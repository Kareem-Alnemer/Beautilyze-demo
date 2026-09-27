import { getRecentChecks, getScanHistory } from '../api';

jest.mock('../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { supabase } from '../../lib/supabase';

describe('catalog api guest guards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getRecentChecks returns [] without querying for empty userId', async () => {
    await expect(getRecentChecks('')).resolves.toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('getRecentChecks returns [] without querying for blank userId', async () => {
    await expect(getRecentChecks('   ')).resolves.toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('getScanHistory returns [] without querying for empty userId', async () => {
    await expect(getScanHistory('')).resolves.toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });
  it('propagates database failures instead of returning empty history', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    const chain = { select: jest.fn(), eq: jest.fn(), order: jest.fn(), limit: jest.fn() };
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.order.mockReturnValue(chain);
    chain.limit.mockResolvedValue({ data: null, error: { message: 'offline' } });
    (supabase.from as jest.Mock).mockReturnValue(chain);
    try { await expect(getRecentChecks('owner')).rejects.toThrow('Could not load recent checks'); }
    finally { log.mockRestore(); }
  });
});
