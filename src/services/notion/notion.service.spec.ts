// notion.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotionService } from './notion.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('NotionService', () => {
  let service: NotionService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotionService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
            post: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotionService>(NotionService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDatabaseInfo', () => {
    it('should call httpService.get with the correct endpoint', () => {
      const endpoint = `${process.env.NOTION_BASE_PATH}/databases/${process.env.NOTION_DATABASE_ID}`;
      // AxiosResponseのモックを作成
      const mockResponse: AxiosResponse = {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: { 'Content-Type': 'application/json' } as any },
      };
      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      service.getDatabaseInfo();

      expect(httpService.get).toHaveBeenCalledWith(
        endpoint,
        expect.any(Object),
      );
    });
  });

  describe('getRecordInfo', () => {
    it('should call httpService.post with the correct endpoint and payload', () => {
      const endpoint = `${process.env.NOTION_BASE_PATH}/databases/${process.env.NOTION_DATABASE_ID}/query`;
      const payload = {
        filter: {
          property: 'Title',
          rich_text: {
            equals: 'Day1',
          },
        },
      };
      // AxiosResponseのモックを作成
      const mockResponse: AxiosResponse = {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: { 'Content-Type': 'application/json' } as any },
      };
      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      service.getRecordInfo();

      expect(httpService.post).toHaveBeenCalledWith(
        endpoint,
        payload,
        expect.any(Object),
      );
    });
  });
});
