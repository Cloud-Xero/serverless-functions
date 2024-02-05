import { Injectable } from '@nestjs/common';

@Injectable()
export class HogeService {
  getHello(): string {
    return 'hoge hoge!';
  }
}
