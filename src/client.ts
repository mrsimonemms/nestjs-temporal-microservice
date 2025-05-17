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
import { Connection, Client as TemporalClient } from '@temporalio/client';

import { IClientConnectionOpts } from './interfaces';

export class TemporalPubSubClient extends ClientProxy {
  private client?: TemporalClient;

  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly opts: IClientConnectionOpts = {}) {
    super();
  }

  async connect(): Promise<any> {
    const connection = await Connection.connect(this.opts?.connection);

    this.client = new TemporalClient({
      // Order is important to ensure that the connection is always from the constructor
      ...this.opts.client,
      connection,
    });
  }

  async close(): Promise<void> {
    this.logger.debug('Closing Temporal connection');
    await this.client?.connection.close();
  }

  async dispatchEvent(packet: ReadPacket<any>): Promise<any> {
    await Promise.resolve();
    return console.log('event to dispatch: ', packet);
  }

  publish(
    packet: ReadPacket<unknown>,
    callback: (packet: WritePacket<unknown>) => void,
  ): () => void {
    if (!this.client) {
      throw new Error(
        'Not initialized. Please call the "listen"/"startAllMicroservices" method before accessing the server.',
      );
    }
    // this.client.workflow.start();
    console.log('message:', packet);

    // In a real-world application, the "callback" function should be executed
    // with payload sent back from the responder. Here, we'll simply simulate (5 seconds delay)
    // that response came through by passing the same "data" as we've originally passed in.
    setTimeout(() => {
      console.log('end of timeout');
      callback({
        response: packet.data,
        isDisposed: true,
      });
    }, 5000);

    console.log('start of timeout');

    return () => console.log('teardown');
  }

  unwrap<T = TemporalClient>(): T {
    if (!this.client) {
      throw new Error(
        'Not initialized. Please call the "listen"/"startAllMicroservices" method before accessing the server.',
      );
    }
    return this.client as T;
  }
}
