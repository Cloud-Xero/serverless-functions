import { Module } from '@nestjs/common';
import { HogeService } from './hoge.service';

@Module({
  imports: [],
  controllers: [],
  providers: [HogeService],
  exports: [HogeService],
})
export class HogeModule {}
