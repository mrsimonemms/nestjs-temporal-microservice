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
import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';

import { MATH_SERVICE } from './math.constants';
import { MathController } from './math.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: MATH_SERVICE,
        // transport: Transport.KAFKA,
      },
    ]),
  ],
  controllers: [MathController],
})
export class MathModule {}
