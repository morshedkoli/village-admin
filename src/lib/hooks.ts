"use client";

import { useEffect, useState } from "react";
import {
  subscribeVillageOverview,
  subscribeDonations,
  subscribeProjects,
  subscribeProblems,
  subscribeUsers,
  subscribeNotifications,
  subscribeUserNotifications,
  subscribePaymentAccounts,
} from "./firestore-service";
import type {
  VillageOverview,
  Donation,
  DevelopmentProject,
  ProblemReport,
  Citizen,
  AppNotification,
  PaymentAccounts,
} from "./models";

export function useVillageOverview() {
  const [data, setData] = useState<VillageOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeVillageOverview((overview) => {
      setData(overview);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { data, loading };
}

export function useDonations() {
  const [data, setData] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeDonations((donations) => {
      setData(donations);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { data, loading };
}

export function useProjects() {
  const [data, setData] = useState<DevelopmentProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeProjects((projects) => {
      setData(projects);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { data, loading };
}

export function useProblems() {
  const [data, setData] = useState<ProblemReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeProblems((problems) => {
      setData(problems);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { data, loading };
}

export function useUsers() {
  const [data, setData] = useState<Citizen[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeUsers((users) => {
      setData(users);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { data, loading };
}

export function useNotifications() {
  const [data, setData] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeNotifications((notifications) => {
      setData(notifications);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { data, loading };
}

export function useUserNotifications() {
  const [data, setData] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeUserNotifications((notifications) => {
      setData(notifications);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { data, loading };
}

export function usePaymentAccounts() {
  const [data, setData] = useState<PaymentAccounts>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribePaymentAccounts((accounts) => {
      setData(accounts);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { data, loading };
}
