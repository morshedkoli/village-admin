const DEFAULT_BOOTSTRAP_ADMIN_EMAILS = ["murshedkoli@gmail.com"];

export function normalizeAdminEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

export function getBootstrapAdminEmails(): string[] {
  const envEmails = process.env.NEXT_PUBLIC_BOOTSTRAP_ADMIN_EMAILS;
  if (!envEmails) {
    return [...DEFAULT_BOOTSTRAP_ADMIN_EMAILS];
  }

  const parsed = envEmails
    .split(",")
    .map((e) => normalizeAdminEmail(e))
    .filter(Boolean);

  return parsed.length > 0 ? parsed : [...DEFAULT_BOOTSTRAP_ADMIN_EMAILS];
}

export function isBootstrapAdminEmail(email: string | null | undefined): boolean {
  const normalized = normalizeAdminEmail(email);
  if (!normalized) return false;
  return getBootstrapAdminEmails().includes(normalized);
}
