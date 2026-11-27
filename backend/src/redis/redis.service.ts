import { Injectable, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";
import { loadEnvConfig } from "../config/env.config";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly prefix: string;

  constructor() {
    const config = loadEnvConfig();
    this.prefix = config.redisKeyPrefix;
    this.client = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });
  }

  private k(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(this.k(key));
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.client.set(this.k(key), value, "EX", ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.client.del(this.k(key));
  }

  async incrWithTtl(key: string, ttlSeconds: number): Promise<number> {
    const namespaced = this.k(key);
    const count = await this.client.incr(namespaced);
    if (count === 1) {
      await this.client.expire(namespaced, ttlSeconds);
    }
    return count;
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(this.k(key));
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
