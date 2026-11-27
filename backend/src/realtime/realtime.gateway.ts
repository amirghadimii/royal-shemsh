import { Logger } from "@nestjs/common";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import { AuthService } from "../auth/auth.service";
import type { SessionUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";

export interface PriceUpdateEvent {
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

export interface BoardStatusEvent {
  tradingStopped: boolean;
  workingHours: string;
  portalNoticeText?: string;
}

export interface NewOrderEvent {
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

export interface OrderUpdatedEvent extends NewOrderEvent {
  rejectionReason?: string | null;
  decidedAt: string;
}

export interface PreOrderUpdatedEvent {
  id: string;
  userId: string;
  productId: string;
  status: string;
  orderId?: string | null;
  quoteCode?: string | null;
}

function extractSocketToken(client: Socket): string | null {
  const authToken = client.handshake.auth?.token;
  if (typeof authToken === "string" && authToken.trim()) {
    return authToken.trim();
  }
  const authHeader = client.handshake.headers?.authorization;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  const cookieHeader = client.handshake.headers?.cookie;
  if (typeof cookieHeader === "string") {
    for (const part of cookieHeader.split(";")) {
      const [k, ...rest] = part.trim().split("=");
      if (k === "rs_session") {
        return decodeURIComponent(rest.join("="));
      }
    }
  }
  return null;
}

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);
  private seq = 0;
  private readonly connectedUserCounts = new Map<string, number>();

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService
  ) {}

  async handleConnection(client: Socket) {
    const token = extractSocketToken(client);
    const user = token ? await this.authService.getSession(token) : null;

    if (!user) {
      client.emit("auth_error", { message: "احراز هویت سوکت نامعتبر است" });
      client.disconnect(true);
      return;
    }

    (client.data as { user?: SessionUser }).user = user;

    if (user.role.code === "ADMIN" || user.role.code === "SYSTEM_MANAGER") {
      await client.join("role:admin");
    }
    await client.join(`user:${user.id}`);
    this.connectedUserCounts.set(
      user.id,
      (this.connectedUserCounts.get(user.id) ?? 0) + 1
    );

    client.emit("connected", {
      userId: user.id,
      role: user.role.code,
    });
    this.logger.log(`Socket connected: ${user.username} (${user.role.code})`);
  }

  handleDisconnect(client: Socket) {
    const user = (client.data as { user?: SessionUser }).user;
    if (user) {
      const next = (this.connectedUserCounts.get(user.id) ?? 1) - 1;
      if (next <= 0) this.connectedUserCounts.delete(user.id);
      else this.connectedUserCounts.set(user.id, next);
      this.logger.log(`Socket disconnected: ${user.username}`);
    }
  }

  getOnlineUserIds(): string[] {
    return Array.from(this.connectedUserCounts.keys());
  }

  broadcastInternalMessage(
    userIds: string[],
    payload: {
      id: string;
      title: string;
      body: string;
      category: string;
      priorityColor: string;
      createdAt: string;
    }
  ) {
    if (!this.server) return;
    for (const uid of userIds) {
      this.server.to(`user:${uid}`).emit("message:new", payload);
    }
  }

  @SubscribeMessage("ping")
  handlePing(client: Socket) {
    client.emit("pong", { ts: Date.now() });
  }

  async broadcastPriceUpdate(
    payload: Omit<PriceUpdateEvent, "seq">
  ): Promise<PriceUpdateEvent> {
    const event: PriceUpdateEvent = {
      seq: ++this.seq,
      ...payload,
    };

    if (!this.server) return event;

    // Admins & system managers always receive all product updates
    this.server.to("role:admin").emit("price:update", event);

    // Regular users only receive updates for products allowed by their groups
    const allowedMembers = await this.prisma.userGroupMember.findMany({
      where: {
        user: {
          role: {
            code: "REGULAR",
          },
        },
        group: {
          products: {
            some: { productId: payload.productId },
          },
        },
      },
      select: { userId: true },
      distinct: ["userId"],
    });

    for (const member of allowedMembers) {
      this.server.to(`user:${member.userId}`).emit("price:update", event);
    }

    return event;
  }

  broadcastBoardStatus(payload: BoardStatusEvent) {
    if (!this.server) return;
    this.server.emit("board:status", payload);
  }

  broadcastNewOrder(payload: NewOrderEvent) {
    if (!this.server) return;
    this.server.to("role:admin").emit("order:new", payload);
  }

  broadcastOrderUpdated(payload: OrderUpdatedEvent) {
    if (!this.server) return;
    this.server.to("role:admin").emit("order:updated", payload);
    this.server.to(`user:${payload.userId}`).emit("order:updated", payload);
  }

  broadcastPreOrderUpdated(payload: PreOrderUpdatedEvent) {
    if (!this.server) return;
    this.server.to("role:admin").emit("preorder:updated", payload);
    this.server.to(`user:${payload.userId}`).emit("preorder:updated", payload);
  }
}
