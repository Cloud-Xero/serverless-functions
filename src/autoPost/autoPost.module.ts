import { Module } from '@nestjs/common';
import { AutoPostController } from './autoPost.controller';
import { AutoPostService } from './autoPost.service';

@Module({
  imports: [],
  controllers: [AutoPostController],
  providers: [AutoPostService],
})
export class HelloWorldModule {}
