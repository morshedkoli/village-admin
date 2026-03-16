export interface VillageOverview {
  name: string;
  totalCitizens: number;
  totalFundCollected: number;
  totalSpent: number;
}

export function availableBalance(v: VillageOverview): number {
  return v.totalFundCollected - v.totalSpent;
}

export interface Donation {
  id: string;
  donorName: string;
  amount: number;
  paymentMethod: string;
  createdAt: Date;
  userId: string;
  status: "Pending" | "Approved" | "Rejected";
  transactionId: string;
  senderNumber: string;
}

export interface ProblemReport {
  id: string;
  title: string;
  description: string;
  status: "Pending" | "Approved" | "Completed";
  photoUrl: string;
  location: string;
  createdAt: Date;
  reportedBy: string;
  reportedByName: string;
}

export interface DevelopmentProject {
  id: string;
  title: string;
  description: string;
  estimatedCost: number;
  allocatedFunds: number;
  status: "Planning" | "In Progress" | "Completed";
  photos: string[];
  updates: string[];
  spendingReport: string[];
  createdAt?: Date;
}

export interface Citizen {
  id: string;
  name: string;
  profession: string;
  phone: string;
  photoUrl: string;
  village: string;
  email?: string;
  address?: string;
  nidNumber?: string;
  bloodGroup?: string;
  dateOfBirth?: string;
  isCitizen?: boolean;
  blocked?: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: "donation" | "problem" | "citizen" | "project";
  createdAt: Date;
}

export interface PaymentAccount {
  number: string;
  name: string;
  bankName?: string;
  branch?: string;
}

export type PaymentAccounts = Record<string, PaymentAccount>;
