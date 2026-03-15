import { db } from "./firebase";
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
  where,
  Unsubscribe,
  DocumentData,
} from "firebase/firestore";
import { toDate, toNumber } from "./converters";
import type {
  VillageOverview,
  Donation,
  ProblemReport,
  DevelopmentProject,
  Citizen,
  AppNotification,
} from "./models";

const VILLAGE_DOC_ID = "main_village";

// --- Village Overview ---

export function subscribeVillageOverview(
  callback: (data: VillageOverview) => void
): Unsubscribe {
  return onSnapshot(doc(db, "villages", VILLAGE_DOC_ID), (snap) => {
    const d = snap.data() ?? {};
    callback({
      name: (d.name as string) ?? "Our Village",
      totalCitizens: toNumber(d.totalCitizens),
      totalFundCollected: toNumber(d.totalFundCollected),
      totalSpent: toNumber(d.totalSpent),
    });
  });
}

export async function updateVillageOverview(
  data: Partial<VillageOverview>
): Promise<void> {
  await setDoc(doc(db, "villages", VILLAGE_DOC_ID), data as DocumentData, {
    merge: true,
  });
}

// --- Donations ---

function mapDonation(id: string, d: DocumentData): Donation {
  return {
    id,
    donorName: (d.donorName as string) ?? "",
    amount: toNumber(d.amount),
    paymentMethod: (d.paymentMethod as string) ?? "",
    createdAt: toDate(d.createdAt),
    userId: (d.userId as string) ?? "",
  };
}

export function subscribeDonations(
  callback: (donations: Donation[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "donations"),
    orderBy("createdAt", "desc"),
    limit(200)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((doc) => mapDonation(doc.id, doc.data())));
  });
}

export async function deleteDonation(id: string): Promise<void> {
  await deleteDoc(doc(db, "donations", id));
}

// --- Projects ---

function mapProject(id: string, d: DocumentData): DevelopmentProject {
  return {
    id,
    title: (d.title as string) ?? "",
    description: (d.description as string) ?? "",
    estimatedCost: toNumber(d.estimatedCost),
    allocatedFunds: toNumber(d.allocatedFunds),
    status: (d.status as DevelopmentProject["status"]) ?? "Planning",
    photos: Array.isArray(d.photos) ? d.photos : [],
    updates: Array.isArray(d.updates) ? d.updates : [],
    spendingReport: Array.isArray(d.spendingReport) ? d.spendingReport : [],
    createdAt: d.createdAt ? toDate(d.createdAt) : undefined,
  };
}

export function subscribeProjects(
  callback: (projects: DevelopmentProject[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "projects"),
    orderBy("createdAt", "desc"),
    limit(200)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((doc) => mapProject(doc.id, doc.data())));
  });
}

export async function createProject(
  data: Omit<DevelopmentProject, "id">
): Promise<void> {
  const { createdAt: _, ...rest } = data;
  await addDoc(collection(db, "projects"), {
    ...rest,
    createdAt: serverTimestamp(),
  });
}

export async function updateProject(
  id: string,
  data: Partial<DevelopmentProject>
): Promise<void> {
  const { id: _, createdAt: __, ...rest } = data;
  await updateDoc(doc(db, "projects", id), rest as DocumentData);
}

export async function deleteProject(id: string): Promise<void> {
  await deleteDoc(doc(db, "projects", id));
}

// --- Problems ---

function mapProblem(id: string, d: DocumentData): ProblemReport {
  return {
    id,
    title: (d.title as string) ?? "",
    description: (d.description as string) ?? "",
    status: (d.status as ProblemReport["status"]) ?? "Pending",
    photoUrl: (d.photoUrl as string) ?? "",
    location: (d.location as string) ?? "",
    createdAt: toDate(d.createdAt),
    reportedBy: (d.reportedBy as string) ?? "",
    reportedByName: (d.reportedByName as string) ?? "",
  };
}

export function subscribeProblems(
  callback: (problems: ProblemReport[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "problems"),
    orderBy("createdAt", "desc"),
    limit(200)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((doc) => mapProblem(doc.id, doc.data())));
  });
}

export async function updateProblemStatus(
  id: string,
  status: ProblemReport["status"]
): Promise<void> {
  await updateDoc(doc(db, "problems", id), { status });
}

export async function deleteProblem(id: string): Promise<void> {
  await deleteDoc(doc(db, "problems", id));
}

// --- Users / Citizens ---

function mapCitizen(id: string, d: DocumentData): Citizen {
  return {
    id,
    name: (d.name as string) ?? "",
    profession: (d.profession as string) ?? "",
    phone: (d.phone as string) ?? "",
    photoUrl: (d.photoUrl as string) ?? "",
    village: (d.village as string) ?? "",
    email: (d.email as string) ?? "",
    address: (d.address as string) ?? "",
    nidNumber: (d.nidNumber as string) ?? "",
    bloodGroup: (d.bloodGroup as string) ?? "",
    dateOfBirth: (d.dateOfBirth as string) ?? "",
    isCitizen: d.isCitizen === true,
    blocked: d.blocked === true,
  };
}

export function subscribeUsers(
  callback: (users: Citizen[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "users"),
    where("isCitizen", "==", true),
    orderBy("name")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((doc) => mapCitizen(doc.id, doc.data())));
  });
}

export async function blockUser(id: string, blocked: boolean): Promise<void> {
  await updateDoc(doc(db, "users", id), { blocked });
}

// --- Notifications ---

function mapNotification(id: string, d: DocumentData): AppNotification {
  return {
    id,
    title: (d.title as string) ?? "",
    body: (d.body as string) ?? "",
    type: (d.type as AppNotification["type"]) ?? "donation",
    createdAt: toDate(d.createdAt),
  };
}

export function subscribeNotifications(
  callback: (notifications: AppNotification[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "notifications"),
    orderBy("createdAt", "desc"),
    limit(200)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((doc) => mapNotification(doc.id, doc.data())));
  });
}

export async function createNotification(data: {
  title: string;
  body: string;
  type: AppNotification["type"];
}): Promise<void> {
  await addDoc(collection(db, "notifications"), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function deleteNotification(id: string): Promise<void> {
  await deleteDoc(doc(db, "notifications", id));
}
