import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
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
  @Inject()
  private httpService: HttpService;
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
   * カルーセル用のアイテムコンテナIDを取得
   * @param mediaPath メディアのURL
   * @returns アイテムコンテナID
   */
  private getItemContainerId = async (mediaPath: string) => {
    // TODO: 画像か動画化の判断が必要
    const updatedRequestOptions = {
      ...this.requestOptions,
      params: {
        ...this.requestOptions.params,
        is_carousel_item: true,
        image_url: mediaPath,
        video_path: mediaPath,
        media_type: 'VIDEO',
      },
    };
    const endpoint = `${process.env.INSTAGRAM_GRAPH_BASE_PATH}/${process.env.INSTAGRAM_ACCOUNT_ID_01}/media`;
    const res: AxiosResponse = await lastValueFrom(
      this.httpService.post(endpoint, {}, updatedRequestOptions),
    );
    console.log('res.data.id', res.data.id);
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
    const captionQueryString = `caption=${caption}`;
    const mediaQueryString = 'media_type=CAROUSEL';
    const childrenQueryString = idList.map((id) => `children=${id}`).join('&');
    const tokenQueryString = `access_token=${this.requestOptions.params.access_token}`;
    const endpoint = `${process.env.INSTAGRAM_GRAPH_BASE_PATH}/${process.env.INSTAGRAM_ACCOUNT_ID_01}/media?${captionQueryString}&${mediaQueryString}&${childrenQueryString}&${tokenQueryString}`;

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
    const info = record.properties;

    const tags: string = info.Tags['rich_text'].name;
    const caption: string = info.Caption['rich_text'].name;
    const imagePath: string = info.Thumbnail['files'][0].file.url;

    // キャプションの加工（改行＆ハッシュタグの追加）
    const explanation =
      caption.replace(/\n/g, '<br>') + '<br><br>' + tags.replace(/\n/g, '<br>');

    // コンテナIDを取得
    const containerId = await this.getContainerId(imagePath, explanation);

    // メディア投稿
    const status: number = await this.postMedia(containerId);

    return status;
  };

  /**
   * Instagaramにフィード投稿（写真　複数枚）
   * @returns
   */
  executePostingCarousel = async (
    mediaPathList: string[],
    caption: string,
  ): Promise<number> => {
    // 写真・動画ごとにコンテナIDを取得
    const containerIdList = mediaPathList.map((path) => {
      return this.getItemContainerId(path);
    });

    // カルーセルコンテナIDを取得
    const carouselContainerId: string = await this.getCarouselContainerId(
      await Promise.all(containerIdList),
      caption,
    );

    // メディア投稿
    const status: number = await this.postMedia(carouselContainerId);

    return status;
  };

  /**
   * Instagaramにリール動画を投稿
   * @param videoPath 動画のURL
   * @param caption 投稿のキャプション文
   * @returns
   */
  executePostingReel = async (
    videoPath: string,
    caption: string,
    mediaType: 'REELS',
  ): Promise<number> => {
    // コンテナIDを取得
    const containerId = await this.getContainerId(
      videoPath,
      caption,
      mediaType,
    );

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
