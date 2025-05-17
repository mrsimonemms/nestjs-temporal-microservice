/*
 * Copyright 2025 Simon Emms <simon@simonemms.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';

import { TemporalPubSubServer } from '../../src/index';
import { AppModule } from './app.module';

const logger = new Logger('bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.connectMicroservice<MicroserviceOptions>({
    strategy: new TemporalPubSubServer({
      connection: {
        address: process.env.TEMPORAL_ADDRESS,
      },
      worker: {
        taskQueue: 'math',
      },
    }),
  });

  // This should be enabled for Temporal
  app.enableShutdownHooks();

  await app.startAllMicroservices();
  await app.listen(process.env.SERVER_PORT ?? 3000);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap().catch((err: Error) => {
  logger.fatal(err.stack);
});
