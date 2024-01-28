import { Controller, Get, Post } from '@nestjs/common';
import { NotionService } from './notion.service';

@Controller()
export class NotionController {
  constructor(private readonly notionService: NotionService) {}

  @Get()
  getDatabaseInfo() {
    return this.notionService.getDatabaseInfo();
  }

  @Post()
  getRecordInfo() {
    return this.notionService.getRecordInfo();
  }
}
