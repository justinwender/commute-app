import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:commute@example.com",
  process.env.VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

export async function sendPush(
  subscription: webpush.PushSubscription,
  payload: { title: string; body: string; url?: string }
) {
  return webpush.sendNotification(subscription, JSON.stringify(payload));
}
