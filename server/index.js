import express from "express";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const clients = new Map();

function broadcast(data, excludeId = null) {
  const message = JSON.stringify(data);
  for (const [id, client] of clients) {
    if (id !== excludeId && client.ws.readyState === 1) {
      client.ws.send(message);
    }
  }
}

function getUsersList() {
  return Array.from(clients.values()).map((c) => ({ id: c.id, name: c.name }));
}

wss.on("connection", (ws) => {
  const clientId = crypto.randomUUID();

  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case "join": {
          const name = (message.name || "").trim().slice(0, 50) || "Anonymous";
          clients.set(clientId, { id: clientId, name, ws });
          broadcast({ type: "users", list: getUsersList() });
          ws.send(JSON.stringify({ type: "users", list: getUsersList() }));
          console.log(`[+] ${name} connected (${clients.size} users)`);
          break;
        }
        case "ping":
          ws.send(JSON.stringify({ type: "pong" }));
          break;
        default:
          broadcast({ type: "message", from: clients.get(clientId)?.name, content: message.content }, clientId);
      }
    } catch (e) {
      console.error("Invalid message:", e.message);
    }
  });

  ws.on("close", () => {
    const client = clients.get(clientId);
    if (client) {
      console.log(`[-] ${client.name} disconnected (${clients.size - 1} users)`);
      clients.delete(clientId);
      broadcast({ type: "users", list: getUsersList() });
    }
  });

  ws.on("error", (err) => {
    console.error("WS error:", err.message);
    const client = clients.get(clientId);
    if (client) {
      clients.delete(clientId);
      broadcast({ type: "users", list: getUsersList() });
    }
  });
});

const PORT = process.env.PORT || 3000;
const DIST_PATH = join(__dirname, "..", "dist");

app.use(express.static(DIST_PATH));

app.get("*", (req, res) => {
  res.sendFile(join(DIST_PATH, "index.html"));
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});