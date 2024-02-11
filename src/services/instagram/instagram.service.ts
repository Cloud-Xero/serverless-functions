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
    let requestBody = {};

    // TODO:オブジェクトではなく、文字列にする（エンコードされたまま投稿されてしまうため）
    if (mediaType === 'REELS') {
      requestBody = {
        video_url: path,
        media_type: mediaType,
        caption,
        share_to_feed: false,
      };
    } else {
      requestBody = {
        image_url: path,
        caption,
      };
    }

    console.log('requestBody', requestBody);

    const endpoint = `${process.env.INSTAGRAM_GRAPH_BASE_PATH}/${process.env.INSTAGRAM_ACCOUNT_ID_01}/media?access_token=${process.env.META_ACCESS_TOKEN}`;
    const res: AxiosResponse = await lastValueFrom(
      this.httpService.post(endpoint, requestBody),
    );
    console.log('res.data.id', res.data.id);
    return res.data.id as string;
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
    const tokenQueryString = `access_token=${process.env.META_ACCESS_TOKEN}`;
    const endpoint = `${process.env.INSTAGRAM_GRAPH_BASE_PATH}/${process.env.INSTAGRAM_ACCOUNT_ID_01}/media?${captionQueryString}&${mediaQueryString}&${childrenQueryString}&${tokenQueryString}`;

    const res: AxiosResponse = await lastValueFrom(
      this.httpService.post(endpoint),
    );
    return res.data.id;
  };

  /**【成功】
   * 処理の待機
   * @param delay
   * @returns
   */
  private waitForProcessing = (delay: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, delay));
  };

  /**【成功】
   * メディアの投稿
   * @param creationId
   * @returns ステータスID
   */
  private postMedia = async (creationId: string): Promise<number> => {
    const endpoint = `${process.env.INSTAGRAM_GRAPH_BASE_PATH}/${process.env.INSTAGRAM_ACCOUNT_ID_01}/media_publish?creation_id=${creationId}&access_token=${process.env.META_ACCESS_TOKEN}`;

    // TODO: 時間指定で投稿できるようにする
    try {
      console.log('Waiting for media processing...');
      await this.waitForProcessing(10000);
      const res = await lastValueFrom(this.httpService.post(endpoint));
      return res.status;
    } catch (error) {
      console.error('Error:', error.response.data);
    }
  };

  /**【成功】
   * 改行を施したキャプション文の作成
   * @param caption キャプション
   * @param tags ハッシュタグ
   * @returns エンコードしたキャプション文
   */
  private buildCaption = (caption: string, tags: string): string => {
    return encodeURIComponent(caption + '\n\n' + tags);
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

    // TODO: try-catchを使用する
    // メディア投稿
    return await this.postMedia(containerId);
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

    // TODO: try-catchを使用する
    // メディア投稿
    return await this.postMedia(carouselContainerId);
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

    // TODO: try-catchを使用する
    // メディア投稿
    return await this.postMedia(containerId);
  };

  /**
   * Instagaramにストーリーズを投稿
   * @returns
   */
  executePostingStories = () => {};
}
