const BOOTSTRAP_ADMIN_EMAILS = ["murshedkoli@gmail.com"] as const;

export function normalizeAdminEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

export function isBootstrapAdminEmail(email: string | null | undefined): boolean {
  return BOOTSTRAP_ADMIN_EMAILS.includes(
    normalizeAdminEmail(email) as (typeof BOOTSTRAP_ADMIN_EMAILS)[number]
  );
}

export function getBootstrapAdminEmails(): string[] {
  return [...BOOTSTRAP_ADMIN_EMAILS];
}
