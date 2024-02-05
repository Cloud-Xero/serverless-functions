import { Module } from '@nestjs/common';
import { InstagramService } from './instagram.service';

@Module({
  imports: [],
  controllers: [],
  providers: [InstagramService],
  exports: [InstagramService],
})
export class InstagramModule {}
