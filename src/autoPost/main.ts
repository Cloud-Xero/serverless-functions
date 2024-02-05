import { NestFactory } from '@nestjs/core';
import { AutoPostModule } from './autoPost.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import * as functions from '@google-cloud/functions-framework';

export const createNestServer = async (server) => {
  const app = await NestFactory.create(
    AutoPostModule,
    new ExpressAdapter(server),
  );

  // CORSの有効
  app.enableCors();

  return app.init();
};

const bootstrap = async () => {
  if (process.env.RUNNING_IN_GCF) {
    // Google Cloud Functionsでの実行（functions frameworkではtsをjsにコンパイルしてから実行）
    const server = express();

    createNestServer(server)
      .then(() => console.log('Nest Ready'))
      .catch((err) => console.error('Nest broken', err));

    // functions-frameworkにautoPostを登録
    exports.api = functions.http('autoPost', server);
  } else {
    // 通常のサーバー起動（毎回ビルドしながら開発するのが面倒な場合はこっち）
    const app = await NestFactory.create(AutoPostModule);
    await app.listen(3000);
    console.log(`Server is running on http://localhost:3000/`);
  }
};

bootstrap();
