import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';

interface RequestOptions {
  params: {
    access_token: string;
    fields?: string;
    image_url?: string;
    caption?: string;
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
  private getContainerId = async (): Promise<string> => {
    const updatedRequestOptions = {
      ...this.requestOptions,
      params: {
        ...this.requestOptions.params,
        image_url: 'Notionから取得した画像URL',
        caption: 'Notionから取得したキャプション',
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
   * @returns
   */
  executePostingFeed = async () => {
    const containerId = await this.getContainerId();
    const updatedRequestOptions = {
      ...this.requestOptions,
      params: {
        ...this.requestOptions.params,
        creation_id: containerId,
      },
    };
    const endpoint = `${process.env.INSTAGRAM_GRAPH_BASE_PATH}/${process.env.INSTAGRAM_ACCOUNT_ID_01}/media_publish`;
    const res = await lastValueFrom(
      this.httpService.post(endpoint, {}, updatedRequestOptions),
    );
    console.log(res.status, res.data);
    return res.data;
  };

  /**
   * Instagaramにフィード投稿（写真　複数枚）
   * @returns
   */
  executePostingCarousel = () => {};

  /**
   * Instagaramにリール動画を投稿
   * @returns
   */
  executePostingReel = () => {};

  /**
   * Instagaramにストーリーズを投稿
   * @returns
   */
  executePostingStories = () => {};
}
