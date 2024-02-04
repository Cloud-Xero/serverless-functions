import { Module } from '@nestjs/common';
import { InstagramService } from './instagram.service';

@Module({
  imports: [],
  controllers: [],
  providers: [InstagramService],
})
export class InstagramModule {}
