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
import { CustomTransportStrategy, Server } from '@nestjs/microservices';
import { NativeConnection, Worker } from '@temporalio/worker';

import { IServerConnectionOpts, IServerUnwrap } from './interfaces';

export class TemporalPubSubServer
  extends Server
  implements CustomTransportStrategy
{
  private connection?: NativeConnection;

  private worker?: Worker;

  constructor(private readonly opts: IServerConnectionOpts) {
    super();
  }

  /**
   * Triggered on application shutdown, if shutdown hooks are enabled
   */
  async close(): Promise<void> {
    if (!this.connection) {
      throw new Error(
        'Not initialized. Please call the "connect" method first.',
      );
    }

    this.logger.debug?.('Closing Temporal connection');
    return this.connection?.close();
  }

  /**
   * Triggered when the microservices are started
   */
  async listen(
    callback: (err?: unknown, ...optionalParams: unknown[]) => void,
  ): Promise<void> {
    try {
      this.logger.log('Connecting to Temporal');
      this.connection = await NativeConnection.connect(this.opts.connection);

      this.worker = await Worker.create({
        ...this.opts.worker,
        connection: this.connection,
      });

      this.logger.debug?.('Running Temporal Worker');
      await this.worker.run();
      callback();
    } catch (err) {
      callback(err);
    }
  }

  /**
   * You can ignore this method if you don't want transporter users
   * to be able to register event listeners. Most custom implementations
   * will not need this.
   */
  on() {
    throw new Error('Method is not supported for Temporal server');
  }

  /**
   * You can ignore this method if you don't want transporter users
   * to be able to retrieve the underlying native server. Most custom implementations
   * will not need this.
   */
  unwrap<T = IServerUnwrap>(): T {
    if (!this.connection || !this.worker) {
      throw new Error(
        'Not initialized. Please call the "connect" method first.',
      );
    }
    return { connection: this.connection, worker: this.worker } as T;
  }
}
