import { Module } from '@nestjs/common';
import { InstagramService } from './instagram.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [],
  providers: [InstagramService],
  exports: [InstagramService],
})
export class InstagramModule {}
