import { Global, Module } from '@nestjs/common';
import { ValidateBodyIsNotEmptyPipe } from './pipes/validate-body-is-not-empty.pipe';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [],
  providers: [RedisService, ValidateBodyIsNotEmptyPipe],
  exports: [RedisService, ValidateBodyIsNotEmptyPipe],
})
export class CommonModule {}
