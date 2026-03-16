# Push Notification System — Implementation Details

## Architecture Overview

```
Admin UI → Firestore (notifications collection) → OneSignal API → FCM → Android Devices
```

The admin panel uses **OneSignal** as the push notification service (not raw Firebase Cloud Messaging). Notifications are both persisted in Firestore and broadcast via OneSignal to all enrolled Android devices.

---

## Key Files

| File | Role |
|------|------|
| `src/app/notifications/page.tsx` | Admin UI — compose & send notifications |
| `src/app/api/push/route.ts` | API route — proxies to OneSignal REST API |
| `src/lib/onesignal.ts` | OneSignal service — config & send helpers |
| `src/lib/firestore-service.ts` | Firestore CRUD for `notifications` collection |
| `src/lib/models.ts` | `AppNotification` TypeScript interface |
| `src/lib/hooks.ts` | `useNotifications()` / `useUserNotifications()` hooks |
| `src/app/settings/page.tsx` | OneSignal App ID & API Key configuration UI |

---

## Data Model

**Firestore Collection:** `notifications`

```typescript
interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: "donation" | "problem" | "citizen" | "project";
  source: "user" | "admin";
  createdAt: Date; // serverTimestamp()
}
```

**Firestore Index:**

```json
{
  "collectionGroup": "notifications",
  "fields": [
    { "fieldPath": "source", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

---

## Notification Types

| Type | Purpose |
|------|---------|
| `donation` | Fund / donation alerts |
| `problem` | Problem reports |
| `citizen` | Citizen / user updates |
| `project` | Project progress updates |

---

## Notification Flow

1. **Admin** fills title, body, and selects a type in the notification UI.
2. **Client** calls `createNotification()` → persists to Firestore with `source: "admin"`.
3. **Client** calls `sendPushNotification()` → hits `POST /api/push`.
4. **API route** forwards the request to `https://onesignal.com/api/v1/notifications` with `included_segments: ["All"]`.
5. **OneSignal** distributes the notification via FCM to all enrolled Android devices.

### OneSignal Request Payload

```json
{
  "app_id": "<OneSignal App ID>",
  "included_segments": ["All"],
  "headings": { "en": "<title>" },
  "contents": { "en": "<body>" },
  "data": { "type": "<notification type>" }
}
```

---

## Auto-Generated Notifications

When an admin **approves a donation**, a notification is automatically created in Firestore:

```typescript
{
  title: "নতুন অনুদান",
  body: `${donorName} ৳${amount} অনুদান দিয়েছেন`,
  type: "donation",
  source: "admin",
  createdAt: serverTimestamp(),
}
```

---

## FCM Token Management

The admin panel does **not** manage FCM tokens directly. Token lifecycle is handled entirely on the client side:

- **Android client app** registers with the OneSignal SDK on launch.
- **OneSignal** manages all device token mapping and distribution internally.
- The admin panel only sends messages to the OneSignal API.

---

## OneSignal Configuration

- **Storage:** Browser `localStorage` (`onesignal_app_id`, `onesignal_api_key`).
- **UI:** Configurable via the **Settings** page with a dedicated OneSignal section.
- **Defaults:** Hardcoded fallback values exist in `src/app/api/push/route.ts`.

### Settings Page Helpers (`src/lib/onesignal.ts`)

| Function | Description |
|----------|-------------|
| `getOneSignalConfig()` | Reads App ID & API Key from localStorage (or uses defaults) |
| `saveOneSignalConfig(appId, apiKey)` | Persists credentials to localStorage |
| `sendPushNotification({ title, body, type })` | Sends notification via `/api/push` |

---

## React Hooks

| Hook | Returns | Description |
|------|---------|-------------|
| `useNotifications()` | `{ data: AppNotification[], loading }` | Real-time subscription to **all** notifications |
| `useUserNotifications()` | `{ data: AppNotification[], loading }` | Real-time subscription to **user-generated** notifications only |

---

## Firestore Security Rules

```
match /notifications/{doc} {
  allow read, write: if request.auth != null;
}
```

All authenticated users can read and write notifications. There is no admin-only restriction on this collection.

---

## Dependencies

| Package | Version | Role |
|---------|---------|------|
| `firebase` | ^12.10.0 | Firestore & Auth (not Cloud Messaging) |
| `next` | 16.1.6 | Framework / API routes |
| `react` | 19.2.3 | UI |

> No OneSignal SDK is included — communication is done via HTTP REST API calls only.

---

## ⚠️ Security Considerations

- OneSignal API credentials are **hardcoded as defaults** in `src/app/api/push/route.ts`. These should be moved to environment variables for production.
- The Firestore `notifications` collection allows **any authenticated user** to write. Consider restricting writes to admin-only roles.
