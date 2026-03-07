type Listener = (data: string) => void;
const channels = new Map<string, Set<Listener>>();

export function subscribe(eventId: string, listener: Listener): () => void {
  if (!channels.has(eventId)) channels.set(eventId, new Set());
  channels.get(eventId)!.add(listener);
  return () => {
    channels.get(eventId)?.delete(listener);
  };
}

export function broadcast(eventId: string, data: object): void {
  const payload = JSON.stringify(data);
  channels.get(eventId)?.forEach((listener) => {
    try {
      listener(payload);
    } catch (_) {}
  });
}
