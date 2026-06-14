import { config } from "../config";

export type RealtimeLikePoint = {
  likes: number;
};

type RealtimeLikesResponse = {
  image: RealtimeLikePoint[];
  author: RealtimeLikePoint[];
};

type RealtimeBucketChangedPushMessage = {
  type: "realtime-bucket-changed";
};

type RealtimeResetPushMessage = {
  type: "likes-reset";
};

type RealtimePushMessage =
  | RealtimeBucketChangedPushMessage
  | RealtimeResetPushMessage;

export async function getRealtimeLikes(imageId: string, authorUserId: string) {
  const response = await fetch(
    `${config.realtimeLikesServiceBaseUrl}/public/realtime-likes?imageId=${encodeURIComponent(imageId)}&authorUserId=${encodeURIComponent(authorUserId)}`,
  );

  return (await response.json()) as RealtimeLikesResponse;
}

export function subscribeToRealtimeUpdates(
  onBucketChanged: () => void,
  onReset: () => void,
) {
  const socket = new WebSocket(config.realtimeLikesServiceWebSocketUrl);

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data) as RealtimePushMessage;

    if (message.type === "realtime-bucket-changed") {
      onBucketChanged();
    }

    if (message.type === "likes-reset") {
      onReset();
    }
  });

  return () => {
    socket.close();
  };
}
