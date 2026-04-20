export type Slot = {
  time: Date;
  available: boolean;
  locked?: boolean;
};

export type BranchWithAvailability = {
  id: string;
  name: string;
  address: string;
  openingTime: string;
  closingTime: string;
  timezone: string;
};

export type AppointmentWithBranch = {
  id: string;
  branchId: string;
  scheduledAt: Date;
  status: 'confirmed' | 'cancelled';
  branch: {
    id: string;
    name: string;
    address: string;
  };
};

export type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string; message: string };
