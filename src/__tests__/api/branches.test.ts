import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/branches/route';
import { db } from '@/lib/db';
import type { Branch } from '@/lib/db/schema';

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      branches: {
        findMany: vi.fn(),
      },
    },
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 2 }]),
      }),
    }),
  },
}));

describe('GET /api/branches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns branches with pagination', async () => {
    const mockBranches = [
      { id: '1', name: 'Sandton Main Branch', address: '123 Sandton Drive', openingTime: '08:00:00', closingTime: '17:00:00', timezone: 'Africa/Johannesburg', createdAt: new Date() },
      { id: '2', name: 'Cape Town CBD', address: '45 Main Street', openingTime: '08:30:00', closingTime: '16:30:00', timezone: 'Africa/Johannesburg', createdAt: new Date() },
    ];

    vi.mocked(db.query.branches.findMany).mockResolvedValue(mockBranches as Branch[]);
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 2 }]),
      }),
    } as ReturnType<typeof db.select>);

    const request = new Request('http://localhost/api/branches');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.branches).toHaveLength(2);
    expect(json.data.pagination.total).toBe(2);
  });

  it('returns empty array when no branches exist', async () => {
    vi.mocked(db.query.branches.findMany).mockResolvedValue([]);
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 0 }]),
      }),
    } as ReturnType<typeof db.select>);

    const request = new Request('http://localhost/api/branches');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.branches).toHaveLength(0);
  });

  it('handles search query', async () => {
    vi.mocked(db.query.branches.findMany).mockResolvedValue([]);
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 0 }]),
      }),
    } as ReturnType<typeof db.select>);

    const request = new Request('http://localhost/api/branches?search=Sandton');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
  });
});