import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get("health")
  getHealth() {
    return {
      status: "ok",
      service: "royalshemsh-backend",
      env: process.env.APP_ENV ?? "staging",
      timestamp: new Date().toISOString(),
    };
  }
}
