import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly SECONDS_IN_7_DAYS = 7 * 60 * 60 * 24;

  constructor(configService: ConfigService) {
    this.client = new Redis(configService.getOrThrow('REDIS_URL'));
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(
    key: string,
    value: string | number | Buffer,
    opts?: Partial<{ expireIn: number }>,
  ): Promise<'OK'> {
    return this.client.set(
      key,
      value,
      'EX',
      opts?.expireIn ?? this.SECONDS_IN_7_DAYS,
    );
  }
}
