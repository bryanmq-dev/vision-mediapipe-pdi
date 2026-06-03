import { ref, onUnmounted } from "vue";

interface User {
  id: string;
  name: string;
}

export function useWebSocket() {
  const socket = ref<WebSocket | null>(null);
  const users = ref<User[]>([]);
  const isConnected = ref(false);
  const error = ref<string | null>(null);
  const currentUser = ref<string | null>(null);

  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  function connect(name: string) {
    if (socket.value?.readyState === WebSocket.OPEN) {
      socket.value.close();
    }

    currentUser.value = name;
    error.value = null;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      isConnected.value = true;
      ws.send(JSON.stringify({ type: "join", name }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "users") {
          users.value = data.list;
        }
      } catch {
        console.error("Failed to parse message");
      }
    };

    ws.onerror = () => {
      error.value = "Connection error";
      isConnected.value = false;
    };

    ws.onclose = () => {
      isConnected.value = false;
      socket.value = null;

      if (currentUser.value) {
        reconnectTimer = setTimeout(() => connect(name), 3000);
      }
    };

    socket.value = ws;
  }

  function disconnect() {
    currentUser.value = null;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (socket.value) {
      socket.value.close();
      socket.value = null;
    }
    users.value = [];
    isConnected.value = false;
  }

  onUnmounted(() => {
    disconnect();
  });

  return {
    socket,
    users,
    isConnected,
    error,
    currentUser,
    connect,
    disconnect,
  };
}