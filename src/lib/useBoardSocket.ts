"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";

export interface SocketPriceUpdate {
  seq: number;
  productId: string;
  name: string;
  badge: string;
  subtitle: string;
  buyPrice: string;
  sellPrice: string;
  source: string;
  recordedAt: string;
}

export interface SocketBoardStatus {
  tradingStopped: boolean;
  workingHours: string;
  portalNoticeText?: string;
}

export interface SocketNewOrder {
  id: string;
  quoteCode: string;
  userId: string;
  userName: string;
  productId: string;
  productName: string;
  unit: string;
  side: "BUY" | "SELL";
  quantity: string;
  unitPrice: string;
  totalAmount: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export interface SocketOrderUpdated extends SocketNewOrder {
  rejectionReason?: string | null;
  decidedAt: string;
}

export type SocketStatus = "idle" | "connected" | "disconnected";

export function useBoardSocket(handlers: {
  onPriceUpdate?: (event: SocketPriceUpdate) => void;
  onBoardStatus?: (event: SocketBoardStatus) => void;
  onNewOrder?: (event: SocketNewOrder) => void;
  onOrderUpdated?: (event: SocketOrderUpdated) => void;
  onReconnect?: () => void;
}) {
  const [socketStatus, setSocketStatus] = useState<SocketStatus>("idle");
  const lastSeqRef = useRef(0);
  const hasConnectedOnceRef = useRef(false);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("rs_session_token")
        : null;
    if (!token) return;

    const socket: Socket = io(API_BASE, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 400,
      reconnectionDelayMax: 1500,
    });

    socket.on("connect", () => {
      setSocketStatus("connected");
      if (hasConnectedOnceRef.current) {
        handlersRef.current.onReconnect?.();
      }
      hasConnectedOnceRef.current = true;
    });

    socket.on("disconnect", () => {
      setSocketStatus("disconnected");
    });

    socket.on("connect_error", () => {
      setSocketStatus("disconnected");
    });

    socket.on("price:update", (ev: SocketPriceUpdate) => {
      if (typeof ev?.seq === "number") {
        if (ev.seq <= lastSeqRef.current) return;
        lastSeqRef.current = ev.seq;
      }
      handlersRef.current.onPriceUpdate?.(ev);
    });

    socket.on("board:status", (ev: SocketBoardStatus) => {
      handlersRef.current.onBoardStatus?.(ev);
    });

    socket.on("order:new", (ev: SocketNewOrder) => {
      handlersRef.current.onNewOrder?.(ev);
    });

    socket.on("order:updated", (ev: SocketOrderUpdated) => {
      handlersRef.current.onOrderUpdated?.(ev);
    });

    const handleOffline = () => {
      setSocketStatus("disconnected");
    };
    const handleOnline = () => {
      if (socket.connected) {
        setSocketStatus("connected");
        handlersRef.current.onReconnect?.();
      } else {
        socket.connect();
      }
    };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    const pingTimer = window.setInterval(() => {
      if (socket.connected) {
        socket.emit("ping");
      }
    }, 15_000);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.clearInterval(pingTimer);
      socket.disconnect();
    };
  }, []);

  return { socketStatus };
}
