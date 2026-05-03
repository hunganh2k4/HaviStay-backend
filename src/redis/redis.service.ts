import { Injectable } from '@nestjs/common';
import { Redis } from '@upstash/redis';

@Injectable()
export class RedisService {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    console.log('Upstash Redis Ready');
  }

  async set(
    key: string,
    value: string,
    expiresIn?: number,
  ): Promise<void> {
    if (expiresIn) {
      await this.client.set(key, value, {
        ex: expiresIn,
      });
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    const result = await this.client.exists(key);
    return result ? 1 : 0;
  }
}