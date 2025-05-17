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
import { DefaultLogger, Runtime } from '@temporalio/worker';

export * from './client';
export * from './interfaces';
export * from './server';

// Set to trace level to let the NestJS logger handle log output
// "INFO" level can be a bit chatty so gets sent to debug
const logger = new DefaultLogger('TRACE', ({ level, message, meta }) => {
  const l = new Logger('temporal');

  switch (level) {
    case 'WARN':
      l.warn(message, meta);
      break;
    case 'ERROR':
      l.error(message, meta);
      break;
    case 'TRACE':
      l.verbose(message, meta);
      break;
    default:
      l.debug(message, meta);
      break;
  }
});

Runtime.install({
  logger,
});
