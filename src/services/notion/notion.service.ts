import { Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { DatabaseInfo, RecordInfo } from './types';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class NotionService {
  @Inject()
  private httpService: HttpService;
  private requestOptions = {
    headers: {
      Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
      'Notion-Version': process.env.NOTION_API_VERSION,
      'Content-Type': 'application/json',
    },
  };
  getDatabaseInfo = async () => {
    try {
      const endpoint = `${process.env.NOTION_BASE_PATH}/databases/${process.env.NOTION_DATABASE_ID}`;
      const res = await lastValueFrom(
        this.httpService.get(endpoint, this.requestOptions),
      );
      return res.data as DatabaseInfo;
    } catch (error) {
      throw new Error('Failed to get database information.');
    }
  };

  getRecordInfo = async () => {
    try {
      const endpoint = `${process.env.NOTION_BASE_PATH}/databases/${process.env.NOTION_DATABASE_ID}/query`;
      const payload = {
        filter: {
          property: 'Title',
          rich_text: {
            equals: 'Day1',
          },
        },
      };
      const res = await lastValueFrom(
        this.httpService.post(endpoint, payload, this.requestOptions),
      );
      return res.data as RecordInfo;
    } catch (error) {
      throw new Error('Failed to get record information.');
    }
  };
}

// https://api.notion.com/v1/databases/08e8a165a2c1424fb7f9d6e5224d2a1c
