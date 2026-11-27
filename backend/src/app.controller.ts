import { Controller, Get } from "@nestjs/common";
import { loadEnvConfig } from "./config/env.config";

@Controller()
export class AppController {
  private readonly config = loadEnvConfig();

  @Get("health")
  getHealth() {
    return {
      status: "ok",
      service: "royalshemsh-backend",
      env: this.config.env,
      redisKeyPrefix: this.config.redisKeyPrefix,
      allowSampleSeed: this.config.allowSampleSeed,
      allowTradeTests: this.config.allowTradeTests,
      timestamp: new Date().toISOString(),
    };
  }
}
