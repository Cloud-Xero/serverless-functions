import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';

interface RequestOptions {
  params: {
    access_token: string;
    fields?: string;
    image_url?: string;
    video_url?: string;
    caption?: string;
    media_type?: string;
  };
}

@Injectable()
export class InstagramService {
  // private httpService: HttpService;
  constructor(private httpService: HttpService) {}
  private requestOptions: RequestOptions = {
    params: {
      access_token: process.env.META_ACCESS_TOKEN,
    },
  };

  /**
   * 画像URLとキャプションからコンテナIDを取得
   * @returns コンテナID
   */
  private getContainerId = async (
    path: string,
    caption: string,
    mediaType?: 'REELS',
  ): Promise<string> => {
    const updatedRequestOptions = {
      ...this.requestOptions,
    };

    if (mediaType === 'REELS') {
      updatedRequestOptions.params = {
        ...this.requestOptions.params,
        video_url: path,
        media_type: mediaType,
        caption,
      };
    } else {
      updatedRequestOptions.params = {
        ...this.requestOptions.params,
        image_url: path,
        caption,
      };
    }

    const endpoint = `${process.env.INSTAGRAM_GRAPH_BASE_PATH}/${process.env.INSTAGRAM_ACCOUNT_ID_01}/media`;
    const res: AxiosResponse = await lastValueFrom(
      this.httpService.post(endpoint, {}, updatedRequestOptions),
    );
    console.log('res.data.id', res.data.id);
    return res.data.id as string;
  };

  /**
   * 画像か動画かで使用するプロパティが異なる
   * @param mediaPath
   * @returns
   */
  private getMediaParams = (mediaPath: string) => {
    const path = new URL(mediaPath);
    const pathname = path.pathname;
    const extension = pathname.split('.').pop();

    console.log('extension:', extension);

    // 画像の場合
    if (['jpeg', 'jpg'].includes(extension)) {
      return {
        image_url: mediaPath,
      };
    }

    // 動画の場合
    if (['mov', 'mp4'].includes(extension)) {
      return {
        video_url: mediaPath,
        media_type: 'VIDEO',
      };
    }

    throw new Error(`拡張子「${extension}」は投稿できないファイルです。`);
  };

  /**【成功】
   * カルーセル用のアイテムコンテナIDを取得
   * @param mediaPath メディアのURL
   * @returns アイテムコンテナID
   */
  private getItemContainerId = async (mediaPath: string) => {
    const mediaParams = this.getMediaParams(mediaPath);
    // TODO: 画像か動画化の判断が必要
    const requestBody = {
      is_carousel_item: 'true',
      ...mediaParams,
    };

    console.log('--requestBody--');
    console.log(requestBody);

    const endpoint = `${process.env.INSTAGRAM_GRAPH_BASE_PATH}/${process.env.INSTAGRAM_ACCOUNT_ID_01}/media?access_token=${process.env.META_ACCESS_TOKEN}`;

    const res: AxiosResponse = await lastValueFrom(
      this.httpService.post(endpoint, requestBody),
    );
    console.log('res.data.id', res.data.id);
    return res.data.id as string;
  };

  /**【成功】
   * カルーセルコンテナIDを取得
   * @param idList
   * @param caption
   * @returns
   */
  private getCarouselContainerId = async (
    idList: string[],
    caption: string,
  ) => {
    const captionQueryString = `caption=${caption}`;
    const mediaQueryString = 'media_type=CAROUSEL';
    // const childrenQueryString = idList.map((id) => `children=${id}`).join('&');
    const childrenQueryString = `children=${encodeURIComponent(idList.join(','))}`;
    const tokenQueryString = `access_token=${this.requestOptions.params.access_token}`;
    const endpoint = `${process.env.INSTAGRAM_GRAPH_BASE_PATH}/${process.env.INSTAGRAM_ACCOUNT_ID_01}/media?${captionQueryString}&${mediaQueryString}&${childrenQueryString}&${tokenQueryString}`;

    console.log('--endpoint2--');
    console.log(endpoint);

    const res: AxiosResponse = await lastValueFrom(
      this.httpService.post(endpoint),
    );
    console.log('res.data.id', res.data.id);
    return res.data.id;
  };

  /**
   * メディアの投稿
   * @param creationId
   * @returns ステータスID
   */
  private postMedia = async (creationId: string): Promise<number> => {
    const updatedRequestOptions = {
      ...this.requestOptions,
      params: {
        ...this.requestOptions.params,
        creation_id: creationId,
      },
    };
    const endpoint = `${process.env.INSTAGRAM_GRAPH_BASE_PATH}/${process.env.INSTAGRAM_ACCOUNT_ID_01}/media_publish`;
    const res = await lastValueFrom(
      this.httpService.post(endpoint, {}, updatedRequestOptions),
    );

    return res.status;
  };

  /**
   * 改行を施したキャプション文の作成
   * @param caption キャプション
   * @param tags ハッシュタグ
   * @returns エンコードしたキャプション文
   */
  private buildCaption = (caption: string, tags: string): string => {
    return encodeURIComponent(caption + '\n\n' + tags);
    // caption.replace(/\n/g, '<br>') + '<br><br>' + tags.replace(/\n/g, '<br>')
  };

  /**
   * Facebookページの情報を取得
   * @returns
   */
  getMyFacebookPage = async () => {
    const endpoint = `${process.env.INSTAGRAM_GRAPH_BASE_PATH}/me/account`;
    const res = await lastValueFrom(
      this.httpService.get(endpoint, this.requestOptions),
    );
    console.log(res.status, res.data);
    return res.data;
  };

  /**
   * Instagramのビジネスアカウント情報の取得
   * @returns
   */
  getBusinessAccount = async () => {
    const updatedRequestOptions: RequestOptions = {
      ...this.requestOptions,
      params: {
        ...this.requestOptions.params,
        fields: 'accounts{instagram_business_account}',
      },
    };
    const endpoint = `${process.env.INSTAGRAM_GRAPH_BASE_PATH}/me`;
    const res = await lastValueFrom(
      this.httpService.get(endpoint, updatedRequestOptions),
    );
    console.log(res.status, res.data);
    return res.data;
  };

  /**
   * Instagaramにフィード投稿（写真１枚）
   * @param record レコード情報
   * @returns
   */
  executePostingFeed = async (record: PageObjectResponse): Promise<number> => {
    const imagePath: string = record.properties.Thumbnail['files'][0].file.url;

    // キャプションの加工（改行＆ハッシュタグの追加）
    const explanation = this.buildCaption(
      record.properties.Caption['rich_text'][0].text.content,
      record.properties.Tags['rich_text'][0].text.content,
    );

    // コンテナIDを取得
    const containerId = await this.getContainerId(imagePath, explanation);

    // メディア投稿
    const status: number = await this.postMedia(containerId);

    return status;
  };

  /**【成功】
   * Instagaramにフィード投稿（写真　複数枚）
   * @param record レコード情報
   * @returns
   */
  executePostingCarousel = async (
    record: PageObjectResponse,
  ): Promise<number> => {
    const thumbnailObjectList = record.properties.Thumbnail['files'];
    const mediaPathList: string[] = thumbnailObjectList.map(
      (thumbnailObject) => thumbnailObject.file.url,
    );

    // 写真・動画ごとにコンテナIDを取得
    const containerIdList = await Promise.all(
      mediaPathList.map((path) => {
        return this.getItemContainerId(path);
      }),
    );

    // キャプションの加工（改行＆ハッシュタグの追加）
    const explanation = this.buildCaption(
      record.properties.Caption['rich_text'][0].text.content,
      record.properties.Tags['rich_text'][0].text.content,
    );

    // カルーセルコンテナIDを取得
    const carouselContainerId: string = await this.getCarouselContainerId(
      containerIdList,
      explanation,
    );

    // メディア投稿（TODO: try-catch）
    return await this.postMedia(carouselContainerId);
  };

  /**
   * Instagaramにリール動画を投稿
   * @param videoPath 動画のURL
   * @param record レコード情報
   * @returns
   */
  executePostingReel = async (record: PageObjectResponse): Promise<number> => {
    // キャプションの加工（改行＆ハッシュタグの追加）
    const explanation = this.buildCaption(
      record.properties.Caption['rich_text'][0].text.content,
      record.properties.Tags['rich_text'][0].text.content,
    );

    const videoPath: string = record.properties.Thumbnail['files'][0].file.url;

    // コンテナIDを取得
    const containerId = await this.getContainerId(videoPath, explanation);

    // メディア投稿
    const status: number = await this.postMedia(containerId);

    return status;
  };

  /**
   * Instagaramにストーリーズを投稿
   * @returns
   */
  executePostingStories = () => {};
}
