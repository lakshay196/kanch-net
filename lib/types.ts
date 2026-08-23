export type Role = "artisan" | "collector" | "coordinator" | "buyer";

export type SessionUser = {
  phone: string;
  role: Role;
  householdId: string | null;
  name: string;
  home: string;
};

export type Pile = {
  batchId: string;
  householdId: string;
  locality: string;
  productFamily: string;
  size: string;
  colourFamily: string;
  finish: string;
  grade: string;
  declaredQty: number;
  collectedQty: number | null;
  acceptedQty: number | null;
  rejectedQty: number | null;
  damagedQty: number | null;
  status: string;
  rejectionReason: string | null;
  readyDate: string;
  spokenTerm: string;
};
