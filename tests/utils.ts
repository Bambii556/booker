import type { Branch } from '@/lib/db/schema';

export const mockBranch: Branch = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  name: 'Sandton Main Branch',
  address: '123 Sandton Drive, Johannesburg, 2196',
  openingTime: '08:00:00',
  closingTime: '17:00:00',
  timezone: 'Africa/Johannesburg',
  createdAt: new Date('2024-01-01T00:00:00Z'),
};

export const mockBranches: Branch[] = [
  mockBranch,
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Cape Town CBD Branch',
    address: '45 Main Street, Cape Town, 8001',
    openingTime: '08:30:00',
    closingTime: '16:30:00',
    timezone: 'Africa/Johannesburg',
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Durban Sea Point Branch',
    address: '78 Beach Road, Durban, 4001',
    openingTime: '09:00:00',
    closingTime: '15:00:00',
    timezone: 'Africa/Johannesburg',
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
];