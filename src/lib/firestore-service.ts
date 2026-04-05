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
  getDocs,
  serverTimestamp,
  increment,
  where,
  Unsubscribe,
  DocumentData,
  runTransaction,
} from "firebase/firestore";
import { toDate, toNumber } from "./converters";
import type {
  VillageOverview,
  Donation,
  ProblemReport,
  DevelopmentProject,
  Citizen,
  AppNotification,
  PaymentAccounts,
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

// --- Payment Accounts ---

export function subscribePaymentAccounts(
  callback: (accounts: PaymentAccounts) => void
): Unsubscribe {
  return onSnapshot(doc(db, "villages", VILLAGE_DOC_ID), (snap) => {
    const d = snap.data() ?? {};
    const raw = (d.paymentAccounts as Record<string, unknown>) ?? {};
    const accounts: PaymentAccounts = {};
    for (const [key, val] of Object.entries(raw)) {
      if (val && typeof val === "object") {
        const v = val as Record<string, unknown>;
        accounts[key] = {
          number: String(v.number ?? ""),
          name: String(v.name ?? ""),
          ...(v.bankName ? { bankName: String(v.bankName) } : {}),
          ...(v.branch ? { branch: String(v.branch) } : {}),
        };
      }
    }
    callback(accounts);
  });
}

export async function updatePaymentAccounts(
  accounts: PaymentAccounts
): Promise<void> {
  await setDoc(
    doc(db, "villages", VILLAGE_DOC_ID),
    { paymentAccounts: accounts },
    { merge: true }
  );
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
    status: (d.status as Donation["status"]) ?? "Pending",
    transactionId: (d.transactionId as string) ?? "",
    senderNumber: (d.senderNumber as string) ?? "",
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

export async function approveDonation(id: string): Promise<void> {
  const donationRef = doc(db, "donations", id);
  const villageRef = doc(db, "villages", VILLAGE_DOC_ID);

  await runTransaction(db, async (tx) => {
    const donationSnap = await tx.get(donationRef);
    const data = donationSnap.data();
    if (!data) throw new Error("Donation not found");

    const amount = toNumber(data.amount);
    const donorName = (data.donorName as string) ?? "Anonymous";

    tx.update(donationRef, { status: "Approved" });
    tx.set(villageRef, { totalFundCollected: increment(amount) }, { merge: true });
    tx.set(doc(collection(db, "fund_transactions")), {
      type: "donation",
      amount,
      reference: donorName,
      createdAt: serverTimestamp(),
    });
    tx.set(doc(collection(db, "notifications")), {
      title: "নতুন অনুদান",
      body: `${donorName} ৳${amount} অনুদান দিয়েছেন`,
      type: "donation",
      source: "admin",
      createdAt: serverTimestamp(),
    });
  });
}

export async function rejectDonation(id: string): Promise<void> {
  await updateDoc(doc(db, "donations", id), { status: "Rejected" });
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

function sortCitizensByName(citizens: Citizen[]): Citizen[] {
  return [...citizens].sort((a, b) => a.name.localeCompare(b.name));
}

export function subscribeUsers(
  callback: (users: Citizen[]) => void
): Unsubscribe {
  const indexedQuery = query(
    collection(db, "users"),
    where("isCitizen", "==", true),
    orderBy("name")
  );

  let fallbackUnsubscribe: Unsubscribe | null = null;

  const primaryUnsubscribe = onSnapshot(
    indexedQuery,
    (snap) => {
      callback(
        sortCitizensByName(
          snap.docs.map((doc) => mapCitizen(doc.id, doc.data()))
        )
      );
    },
    (error) => {
      if (error.code !== "failed-precondition" || fallbackUnsubscribe) {
        console.error("Failed to subscribe to indexed users", error);
        return;
      }

      const fallbackQuery = query(
        collection(db, "users"),
        where("isCitizen", "==", true)
      );

      fallbackUnsubscribe = onSnapshot(
        fallbackQuery,
        (snap) => {
          callback(
            sortCitizensByName(
              snap.docs.map((doc) => mapCitizen(doc.id, doc.data()))
            )
          );
        },
        (fallbackError) => {
          console.error("Failed to subscribe to fallback users", fallbackError);
        }
      );
    }
  );

  return () => {
    primaryUnsubscribe();
    fallbackUnsubscribe?.();
  };
}

export async function blockUser(id: string, blocked: boolean): Promise<void> {
  await updateDoc(doc(db, "users", id), { blocked });
}

export async function syncCitizenCount(): Promise<void> {
  const q = query(collection(db, "users"), where("isCitizen", "==", true));
  const snap = await getDocs(q);
  await setDoc(
    doc(db, "villages", VILLAGE_DOC_ID),
    { totalCitizens: snap.size },
    { merge: true }
  );
}

// --- Notifications ---

function mapNotification(id: string, d: DocumentData): AppNotification {
  return {
    id,
    title: (d.title as string) ?? "",
    body: (d.body as string) ?? "",
    type: (d.type as AppNotification["type"]) ?? "donation",
    source: (d.source as AppNotification["source"]) ?? "user",
    createdAt: toDate(d.createdAt),
  };
}

function sortNotificationsByCreatedAt(
  notifications: AppNotification[]
): AppNotification[] {
  return [...notifications].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
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
    callback(
      sortNotificationsByCreatedAt(
        snap.docs.map((doc) => mapNotification(doc.id, doc.data()))
      )
    );
  });
}

export function subscribeUserNotifications(
  callback: (notifications: AppNotification[]) => void
): Unsubscribe {
  const indexedQuery = query(
    collection(db, "notifications"),
    where("source", "==", "user"),
    orderBy("createdAt", "desc"),
    limit(100)
  );

  let fallbackUnsubscribe: Unsubscribe | null = null;

  const primaryUnsubscribe = onSnapshot(
    indexedQuery,
    (snap) => {
      callback(
        sortNotificationsByCreatedAt(
          snap.docs.map((doc) => mapNotification(doc.id, doc.data()))
        )
      );
    },
    (error) => {
      if (error.code !== "failed-precondition" || fallbackUnsubscribe) {
        console.error("Failed to subscribe to indexed user notifications", error);
        return;
      }

      const fallbackQuery = query(
        collection(db, "notifications"),
        where("source", "==", "user"),
        limit(100)
      );

      fallbackUnsubscribe = onSnapshot(
        fallbackQuery,
        (snap) => {
          callback(
            sortNotificationsByCreatedAt(
              snap.docs.map((doc) => mapNotification(doc.id, doc.data()))
            )
          );
        },
        (fallbackError) => {
          console.error(
            "Failed to subscribe to fallback user notifications",
            fallbackError
          );
        }
      );
    }
  );

  return () => {
    primaryUnsubscribe();
    fallbackUnsubscribe?.();
  };
}

export async function createNotification(data: {
  title: string;
  body: string;
  type: AppNotification["type"];
}): Promise<void> {
  await addDoc(collection(db, "notifications"), {
    ...data,
    source: "admin",
    createdAt: serverTimestamp(),
  });
}

export async function deleteNotification(id: string): Promise<void> {
  await deleteDoc(doc(db, "notifications", id));
}
