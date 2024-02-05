import { Module } from '@nestjs/common';
import { HelloWorldController } from './helloWorld.controller';
import { HelloWorldService } from './helloWorld.service';
import { HogeModule } from 'src/services/hoge/hoge.module';

@Module({
  imports: [HogeModule],
  controllers: [HelloWorldController],
  providers: [HelloWorldService],
})
export class HelloWorldModule {}
