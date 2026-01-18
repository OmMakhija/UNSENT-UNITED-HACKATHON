import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!SOCKET_URL) {
  throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
}

export const socket = io(SOCKET_URL, {
  path: "/socket.io",
  transports: ["polling", "websocket"], // allow upgrade
  autoConnect: false,
  withCredentials: false,
});
