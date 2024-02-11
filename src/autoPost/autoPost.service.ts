import { Injectable } from '@nestjs/common';
import {
  PageObjectResponse,
  QueryDatabaseResponse,
} from '@notionhq/client/build/src/api-endpoints';
import { InstagramService } from 'src/services/instagram/instagram.service';
import { NotionService } from 'src/services/notion/notion.service';

@Injectable()
export class AutoPostService {
  constructor(
    private readonly notionService: NotionService,
    private readonly instagramService: InstagramService,
  ) {}

  /**
   * Notionからレコードを取得しInstagramに投稿する
   * @returns
   */
  postToInstagramFromNotion = async (): Promise<
    {
      pageId: string;
      status: number;
      message: string;
    }[]
  > => {
    // notionから投稿するレコードを取得（投稿時間も考慮）
    const records: QueryDatabaseResponse =
      await this.notionService.getPageIdsWithStatusPublish();

    const promises = records.results.map(async (record: PageObjectResponse) => {
      const pageId = record.id;
      // Status 列が select プロパティでない
      if (record.properties.Status.type !== 'status') {
        return {
          pageId,
          status: 500,
          message: 'Status列をstatusプロパティに修正してください。',
        };
      }
      // Status 列が未入力
      if (!record.properties.Status.status.name) {
        return {
          pageId,
          status: 500,
          message: 'Status列が未選択です。',
        };
      }

      let status: number;

      switch (record.properties.Type['select'].name) {
        case 'Feed':
          status = await this.instagramService.executePostingFeed(record);
          break;

        case 'Carousel':
          status = await this.instagramService.executePostingCarousel(record);
          break;

        case 'Reels':
          status = await this.instagramService.executePostingReel(record);
          break;

        // 未実装
        // case 'Story':
        //   status = await this.instagramService.executePostingStories(record);
        //   break;

        default:
          break;
      }
      const title = record.properties.Title['title'][0].text.content;
      return {
        pageId,
        status,
        message:
          status >= 200 && status < 300
            ? `${title}の投稿に成功しました。`
            : `${title}の投稿に失敗しました。`,
      };
    });
    return await Promise.all(promises);
  };

  /**
   * 投稿後のNotionのステータスを変更する
   * @param pageId
   * @param newStatus
   */
  updateStatusAfterPost = async (
    pageId: string,
    newStatus: string,
  ): Promise<string | void> => {
    return await this.notionService.updateRecordStatus(pageId, newStatus);
  };
}
