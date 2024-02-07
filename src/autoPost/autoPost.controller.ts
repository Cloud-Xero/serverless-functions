import { Controller, Get } from '@nestjs/common';
import { AutoPostService } from './autoPost.service';

@Controller()
export class AutoPostController {
  constructor(private readonly autoPostService: AutoPostService) {}

  @Get()
  async autoPost() {
    const results: {
      pageId: string;
      status: number;
      message: string;
    }[] = await this.autoPostService.postToInstagramFromNotion();

    console.log('results', results);

    const promises = results.map(async (result) => {
      if (result.status >= 200 && result.status < 300) {
        await this.autoPostService.updateStatusAfterPost(
          result.pageId,
          'Published',
        );
        return result.message;
      } else {
        await this.autoPostService.updateStatusAfterPost(
          result.pageId,
          'Publish failure',
        );
        return result.message;
      }
    });
    return Promise.all(promises);
  }
}
