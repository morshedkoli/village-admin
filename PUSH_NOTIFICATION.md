# Push Notification System

## Architecture Overview

```text
Admin UI -> Firestore notifications -> /api/push -> Firebase Cloud Messaging
```

The admin panel now uses Firebase Cloud Messaging through the Firebase Admin SDK. Notifications are stored in Firestore and then broadcast from the server to the FCM topic `all`.

## Key Files

| File | Role |
|------|------|
| `src/app/notifications/page.tsx` | Admin UI for composing notifications |
| `src/app/api/push/route.ts` | Admin-verified API route that sends FCM messages |
| `src/lib/push.ts` | Client helper for calling `/api/push` |
| `src/lib/firebase-admin.ts` | Firebase Admin Auth, Firestore, and Messaging access |
| `src/lib/firestore-service.ts` | Firestore CRUD for `notifications` |

## Data Model

**Firestore Collection:** `notifications`

```typescript
interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: "donation" | "problem" | "citizen" | "project";
  source: "user" | "admin";
  createdAt: Date;
}
```

## Notification Flow

1. Admin creates a notification in the dashboard.
2. The notification is persisted to Firestore.
3. The client calls `POST /api/push`.
4. The server sends the message to the FCM topic `all`.

## Client Delivery Requirement

The client app must subscribe devices to the FCM topic `all` to receive these admin broadcasts.

## Notes

- No OneSignal configuration is required anymore.
- Firebase Admin service account credentials are required in `.env.local`.
