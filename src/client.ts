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
import { ClientProxy, ReadPacket, WritePacket } from '@nestjs/microservices';
import { NativeConnection, Worker } from '@temporalio/worker';

import { IClientConnectionOpts, IClientUnwrap } from './interfaces';

export class TemporalPubSubClient extends ClientProxy {
  private connection?: NativeConnection;

  private worker?: Worker;

  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly opts: IClientConnectionOpts) {
    super();
  }

  async connect(): Promise<any> {
    this.logger.debug('Connecting to Temporal');
    this.connection = await NativeConnection.connect(this.opts.connection);

    this.logger.debug('Creating Temporal Worker');
    this.worker = await Worker.create({
      ...this.opts.worker,
      connection: this.connection,
    });

    this.logger.debug('Running Temporal Worker');
    await this.worker.run();
  }

  close() {
    this.logger.debug('Closing Temporal connection');
    return this.connection?.close();
  }

  async dispatchEvent(packet: ReadPacket<any>): Promise<any> {
    await Promise.resolve();
    return console.log('event to dispatch: ', packet);
  }

  publish(
    packet: ReadPacket<unknown>,
    callback: (packet: WritePacket<unknown>) => void,
  ): () => void {
    console.log('message:', packet);

    // In a real-world application, the "callback" function should be executed
    // with payload sent back from the responder. Here, we'll simply simulate (5 seconds delay)
    // that response came through by passing the same "data" as we've originally passed in.
    setTimeout(() => {
      console.log('end of timeout');
      callback({ response: packet.data });
    }, 5000);

    console.log('start of timeout');

    return () => console.log('teardown');
  }

  unwrap<T = IClientUnwrap>(): T {
    if (!this.connection || !this.worker) {
      throw new Error(
        'Not initialized. Please call the "connect" method first.',
      );
    }
    return { connection: this.connection, worker: this.worker } as T;
  }
}
