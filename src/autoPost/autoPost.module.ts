import { Module } from '@nestjs/common';
import { AutoPostController } from './autoPost.controller';
import { AutoPostService } from './autoPost.service';
import { NotionModule } from 'src/services/notion/notion.module';
import { InstagramModule } from 'src/services/instagram/instagram.module';

@Module({
  imports: [NotionModule, InstagramModule],
  controllers: [AutoPostController],
  providers: [AutoPostService],
})
export class AutoPostModule {}
