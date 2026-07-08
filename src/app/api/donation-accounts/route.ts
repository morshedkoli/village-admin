import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

interface PaymentAccount {
  id?: string;
  type?: string;
  number?: string;
  name?: string;
}

/**
 * GET /api/donation-accounts
 * Returns all active donation payment accounts for Flutter app consumption
 */
export async function GET(_request: NextRequest) {
  void _request;
  try {
    const adminDb = getAdminDb();

    // Fetch village document containing payment accounts
    const villageDoc = await adminDb.doc("villages/main_village").get();

    if (!villageDoc.exists) {
      return NextResponse.json(
        { error: "Village data not found" },
        { status: 404 }
      );
    }

    const villageData = villageDoc.data();
    const paymentAccounts: PaymentAccount[] = Array.isArray(
      villageData?.paymentAccounts
    )
      ? villageData.paymentAccounts
      : [];

    // Filter only active accounts (with both number and name filled)
    const activeAccounts = paymentAccounts.filter(
      (account) =>
        account.number &&
        account.number.trim() !== "" &&
        account.name &&
        account.name.trim() !== ""
    );

    // Format accounts for Flutter app
    const formattedAccounts = activeAccounts.map((account) => ({
      id: account.id ?? "",
      type: account.type ?? "",
      typeName: getTypeName(account.type ?? ""),
      number: account.number ?? "",
      name: account.name ?? "",
      color: getTypeColor(account.type ?? ""),
    }));

    return NextResponse.json({
      success: true,
      accounts: formattedAccounts,
      count: formattedAccounts.length,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch donation accounts";
    console.error("Error fetching donation accounts:", message);
    return NextResponse.json(
      { success: false, error: "Failed to fetch donation accounts" },
      { status: 500 }
    );
  }
}

function getTypeName(type: string): string {
  const typeMap: Record<string, string> = {
    bkash: "bKash",
    nagad: "Nagad",
    bank: "Bank",
    rocket: "Rocket",
  };
  return typeMap[type.toLowerCase()] || type;
}

function getTypeColor(type: string): string {
  const colorMap: Record<string, string> = {
    bkash: "#E2136E",
    nagad: "#FF6A00",
    bank: "#1E40AF",
    rocket: "#8B2FA0",
  };
  return colorMap[type.toLowerCase()] || "#6B7280";
}
