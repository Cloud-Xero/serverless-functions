import { Injectable } from '@nestjs/common';
import { HogeService } from 'src/services/hoge/hoge.service';

@Injectable()
export class HelloWorldService {
  constructor(private readonly hogeService: HogeService) {}
  getHello(): string {
    return this.hogeService.getHello();
  }
}
