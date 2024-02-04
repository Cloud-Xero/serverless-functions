import { Module } from '@nestjs/common';
import { NotionService } from './notion.service';

@Module({
  imports: [],
  controllers: [],
  providers: [NotionService],
})
export class NotionModule {}
