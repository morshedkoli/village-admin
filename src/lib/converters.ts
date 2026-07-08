import { Timestamp } from "firebase/firestore";

export function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date(0);
}

export function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  return 0;
}
