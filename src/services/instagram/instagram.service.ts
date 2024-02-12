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
  constructor(private httpService: HttpService) {}

  // アクセストークン
  private requestOptions: RequestOptions = {
    params: {
      access_token: process.env.META_ACCESS_TOKEN,
    },
  };

  private ENDPOINT_MAP = {
    MEDIA: `${process.env.INSTAGRAM_GRAPH_BASE_PATH}/${process.env.INSTAGRAM_ACCOUNT_ID_01}/media`,
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
    let params = {};

    // 拡張子のチェックおよびメディアごとのパラメータの生成
    const mediaParams = this.getMediaParams(path);

    if (mediaType === 'REELS') {
      params = {
        ...this.requestOptions.params,
        ...mediaParams,
        caption,
        share_to_feed: false,
      };
    } else {
      params = {
        ...this.requestOptions.params,
        ...mediaParams,
        caption,
      };
    }

    console.log('params', params);

    try {
      const endpoint = this.ENDPOINT_MAP.MEDIA;
      const res: AxiosResponse = await lastValueFrom(
        this.httpService.post(endpoint, {}, { params }),
      );
      console.log('res.data.id', res.data.id);
      return res.data.id as string;
    } catch (error) {
      console.error('コンテナIDの取得に失敗しました :', error.response.data);
    }
  };

  /**【成功】
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

  /**
   * カルーセル用のアイテムコンテナIDを取得
   * @param mediaPath メディアのURL
   * @returns アイテムコンテナID
   */
  private getItemContainerId = async (mediaPath: string) => {
    const mediaParams = this.getMediaParams(mediaPath);
    // TODO: 画像か動画かの判断が必要
    const params = {
      ...this.requestOptions.params,
    };

    const requestBody = {
      ...mediaParams,
      is_carousel_item: 'true',
    };

    const endpoint = this.ENDPOINT_MAP.MEDIA;

    const res: AxiosResponse = await lastValueFrom(
      this.httpService.post(endpoint, requestBody, { params }),
    );
    console.log('carousel item container ID', res.data.id);
    return res.data.id as string;
  };

  /**
   * カルーセルコンテナIDを取得
   * @param idList
   * @param caption
   * @returns
   */
  private getCarouselContainerId = async (
    idList: string[],
    caption: string,
  ) => {
    const params = {
      ...this.requestOptions.params,
    };

    const requestBody = {
      caption,
      media_type: 'CAROUSEL',
    };

    // childrenは先にパスに含めないとエラーになる
    const endpoint = `${this.ENDPOINT_MAP.MEDIA}?children=${encodeURIComponent(idList.join(','))}`;

    const res: AxiosResponse = await lastValueFrom(
      this.httpService.post(endpoint, requestBody, { params }),
    );
    console.log('carousel container ID', res.data.id);

    return res.data.id;
  };

  /**
   * 処理の待機
   * @param delay
   * @returns
   */
  private waitForProcessing = (delay: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, delay));
  };

  /**
   * メディアの投稿
   * @param creationId
   * @returns ステータスID
   */
  private postMedia = async (
    creationId: string,
    delay = 3000,
  ): Promise<number> => {
    const endpoint = `${process.env.INSTAGRAM_GRAPH_BASE_PATH}/${process.env.INSTAGRAM_ACCOUNT_ID_01}/media_publish?creation_id=${creationId}&access_token=${process.env.META_ACCESS_TOKEN}`;

    // TODO: 時間指定で投稿できるようにする
    try {
      console.log('Waiting for media processing...');
      await this.waitForProcessing(delay);
      const res = await lastValueFrom(this.httpService.post(endpoint));
      return res.status;
    } catch (error) {
      console.error('メディアの投稿に失敗しました :', error.response.data);
    }
  };

  /**
   * 改行を施したキャプション文の作成
   * @param caption キャプション
   * @param tags ハッシュタグ
   * @returns 投稿するキャプション文
   */
  private buildCaption = (caption: string, tags: string): string => {
    // return encodeURIComponent(caption + '\n\n' + tags);
    return caption + '\n\n' + tags; // エンコードする必要なかった
  };

  /**
   * Instagramにフィード投稿（写真１枚）
   * @param record レコード情報
   * @returns
   */
  executePostingFeed = async (record: PageObjectResponse): Promise<number> => {
    const imagePath: string = record.properties.Thumbnail['files'][0].file.url;

    // キャプションの加工（改行＆ハッシュタグの追加）
    const explanation = await this.buildCaption(
      record.properties.Caption['rich_text'][0].text.content,
      record.properties.Tags['rich_text'][0].text.content,
    );

    // コンテナIDを取得
    const containerId = await this.getContainerId(imagePath, explanation);

    try {
      // メディア投稿
      const status = await this.postMedia(containerId);
      return status;
    } catch (error) {
      console.error('フィードの投稿に失敗しました :', error.response.data);
    }
  };

  /**【成功】
   * Instagramにフィード投稿（写真　複数枚）
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
    const explanation = await this.buildCaption(
      record.properties.Caption['rich_text'][0].text.content,
      record.properties.Tags['rich_text'][0].text.content,
    );

    // カルーセルコンテナIDを取得
    const carouselContainerId: string = await this.getCarouselContainerId(
      containerIdList,
      explanation,
    );

    try {
      // メディア投稿
      const status = await this.postMedia(carouselContainerId);
      return status;
    } catch (error) {
      console.error(
        'カルーセルフィードの投稿に失敗しました :',
        error.response.data,
      );
    }
  };

  /**【成功】
   * Instagramにリール動画を投稿
   * @param videoPath 動画のURL（動画はCanvaで制作すること）
   * @param record レコード情報
   * @returns
   */
  executePostingReel = async (record: PageObjectResponse): Promise<number> => {
    // キャプションの加工（改行＆ハッシュタグの追加）
    const explanation = await this.buildCaption(
      record.properties.Caption['rich_text'][0].text.content,
      record.properties.Tags['rich_text'][0].text.content,
    );

    const videoPath: string = record.properties.Thumbnail['files'][0].file.url;

    // TODO: カバー画像を指定できるようにする
    // コンテナIDを取得
    const containerId = await this.getContainerId(
      videoPath,
      explanation,
      'REELS',
    );

    try {
      // メディア投稿
      const status = await this.postMedia(containerId, 10000);
      return status;
    } catch (error) {
      console.error('リール動画の投稿に失敗しました :', error.response.data);
    }
  };

  /**
   * Instagaramにストーリーズを投稿
   * @returns
   */
  executePostingStories = () => {};
}
