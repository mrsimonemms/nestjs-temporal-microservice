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
import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy, MessagePattern } from '@nestjs/microservices';

import { ITemporalPacketData, ITemporalPattern } from '../../../src';
import { MATH_SERVICE } from './math.constants';

@Controller()
export class MathController {
  @Inject(MATH_SERVICE)
  private readonly client: ClientProxy;

  @Get()
  execute() {
    const pattern: ITemporalPacketData = {
      taskQueue: 'sum',
      workflowType: 'math',
    };
    const data = [1, 2, 3, 4, 5, 6];

    return this.client.send(pattern, data);
  }

  @MessagePattern<ITemporalPattern>({
    taskQueue: 'sum',
    workflowType: 'math',
  })
  sum(data: number[]): number {
    console.log('sum');
    return (data || []).reduce((a, b) => a + b);
  }
}
