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
import {
  ClientOptions,
  CustomTransportStrategy,
  Server,
} from '@nestjs/microservices';
import { Client, Connection, ConnectionOptions } from '@temporalio/client';

export interface IConnectionOpts {
  // Options on the client such as namespace
  client?: Partial<Omit<ClientOptions, 'connection'>>;
  // Options for the connection factory
  connection?: ConnectionOptions;
}

export class TemporalPubSubServer
  extends Server
  implements CustomTransportStrategy
{
  private client?: Client;

  constructor(private opts: IConnectionOpts = {}) {
    super();
  }

  /**
   * Triggered on application shutdown.
   */
  async close(): Promise<void> {
    await this.client?.connection.close();
  }

  /**
   * Triggered when you run "app.listen()".
   */
  async listen(callback: () => void): Promise<void> {
    const connection = await Connection.connect(this.opts?.connection);

    this.client = new Client({
      // Order is important to ensure that the connection is always from the constructor
      ...this.opts.client,
      connection,
    });

    callback();
  }

  /**
   * You can ignore this method if you don't want transporter users
   * to be able to register event listeners. Most custom implementations
   * will not need this.
   */
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  on(event: string, callback: Function) {
    console.log({
      event,
      callback,
    });
    throw new Error('Method not implemented.');
  }

  /**
   * You can ignore this method if you don't want transporter users
   * to be able to retrieve the underlying native server. Most custom implementations
   * will not need this.
   */
  unwrap<T = never>(): T {
    throw new Error('Method not implemented.');
  }
}
