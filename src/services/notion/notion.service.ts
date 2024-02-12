import { Injectable } from '@nestjs/common';
// import { HttpService } from '@nestjs/axios';
// import { DatabaseInfo } from './types';
// import { lastValueFrom } from 'rxjs';
import { Client } from '@notionhq/client';
import { QueryDatabaseResponse } from '@notionhq/client/build/src/api-endpoints';

@Injectable()
export class NotionService {
  // private httpService: HttpService;
  // private requestOptions = {
  //   headers: {
  //     Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
  //     'Notion-Version': process.env.NOTION_API_VERSION,
  //     'Content-Type': 'application/json',
  //   },
  // };
  // getDatabaseInfo = async () => {
  //   try {
  //     const endpoint = `${process.env.NOTION_BASE_PATH}/databases/${process.env.NOTION_DATABASE_ID}`;

  //     const res = await lastValueFrom(
  //       this.httpService.get(endpoint, this.requestOptions),
  //     );
  //     return res.data as DatabaseInfo;
  //   } catch (error) {
  //     throw new Error('Failed to get database information.');
  //   }
  // };

  // getRecordInfo = async () => {
  //   try {
  //     const endpoint = `${process.env.NOTION_BASE_PATH}/databases/${process.env.NOTION_DATABASE_ID}/query`;
  //     const payload = {
  //       filter: {
  //         property: 'Status',
  //         status: {
  //           equals: 'Publish',
  //         },
  //       },
  //     };
  //     const res = await lastValueFrom(
  //       this.httpService.post(endpoint, payload, this.requestOptions),
  //     );
  //     return res.data as RecordInfo;
  //   } catch (error) {
  //     throw new Error('Failed to get record information.');
  //   }
  // };

  // updateRecordStatus = async () => {
  //   try {
  //     const endpoint = `${process.env.NOTION_BASE_PATH}/databases/${process.env.NOTION_DATABASE_ID}/`;
  //     const payload = {
  //       properties: {
  //         status: 'Published',
  //       },
  //     };
  //     const res = await lastValueFrom(
  //       this.httpService.patch(endpoint, payload, this.requestOptions),
  //     );
  //     return res.data as
  //   } catch (error) {}
  // };

  private notion = new Client({
    auth: process.env.NOTION_TOKEN,
  });
  private databaseId = process.env.NOTION_DATABASE_ID;

  /**
   * 投稿するレコードのページ情報を取得
   * @returns
   */
  getPageIdsWithStatusPublish = async (): Promise<QueryDatabaseResponse> => {
    try {
      const response = await this.notion.databases.query({
        database_id: this.databaseId,
        filter: {
          property: 'Status',
          status: {
            equals: 'Publish',
          },
        },
      });
      return response;
    } catch (error) {
      throw new Error('Failed to get the record ');
    }
  };

  // 現在日時を取得
  private getDatetime = () => {
    // 現在の日時を日本時間で取得し、ISO 8601形式に変換
    const now = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
    return new Date(now).toISOString();
  };

  /**
   * ステータスを Published もしくは Publish failure に変更
   * @param pageId
   * @returns
   */
  updateRecordStatus = async (
    pageId: string,
    newStatus: string,
  ): Promise<string | void> => {
    try {
      await this.notion.pages.update({
        page_id: pageId,
        properties: {
          Status: {
            status: {
              name: newStatus,
            },
          },
          'Posted Date': {
            date: {
              start: newStatus === 'Published' ? this.getDatetime() : '', // 成功時は現在日時を設定
            },
          },
        },
      });
      return `Page ${pageId} status updated to completed.`;
    } catch (error) {
      throw new Error(error.body);
    }
  };
}
