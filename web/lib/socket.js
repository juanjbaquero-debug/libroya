"use client";

import { io } from "socket.io-client";
import { API_URL } from "./api";
import { getToken } from "./session";

export function connectSocket() {
  const token = getToken();
  if (!token) return null;
  return io(API_URL, { auth: { token } });
}
