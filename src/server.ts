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
  CustomTransportStrategy,
  MessageHandler,
  Server,
} from '@nestjs/microservices';
import { NativeConnection, Worker } from '@temporalio/worker';
import { fork } from 'node:child_process';
import { join } from 'node:path';

import {
  IServerConnectionOpts,
  IServerUnwrap,
  ITemporalPattern,
} from './interfaces';

export class TemporalPubSubServer
  extends Server
  implements CustomTransportStrategy
{
  private connection?: NativeConnection;

  private workers: Map<string, Worker> = new Map<string, Worker>();

  constructor(private readonly opts: IServerConnectionOpts) {
    super();
  }

  private async createWorker(
    key: string,
    handler: MessageHandler,
  ): Promise<void> {
    let isValid = false;
    let workflowType: string = '';
    let taskQueue: string = '';
    try {
      const pattern = JSON.parse(key) as ITemporalPattern;
      if (pattern.workflowType && pattern.taskQueue) {
        workflowType = pattern.workflowType;
        taskQueue = pattern.taskQueue;
        isValid = true;
      }
    } catch {
      isValid = false;
    }
    if (!isValid) {
      throw new Error(
        'Temporal microservice requires a workflowType and taskQueue in the pattern',
      );
    }

    await Promise.resolve();

    const workerName = `${workflowType}.${taskQueue}`;

    console.log(handler);

    console.log(__filename);

    const controller = new AbortController();
    const { signal } = controller;

    const child = fork(join(__dirname, 'fork'), { signal });

    console.log(child);

    child
      .on('error', (err: Error) => {
        console.log(err);
      })
      .on(
        'exit',
        (code: number | null, signal: NodeJS.Signals | null): void => {
          console.log({
            code,
            signal,
          });
          console.log('222');
        },
      );

    // const worker = await Worker.create({
    //   connection: this.connection,
    //   namespace: this.opts.namespace ?? 'default',
    //   taskQueue,
    //   workflowsPath: require.resolve('./workflow'),
    //   activities: {
    //     handler,
    //   },
    // });

    // console.log(worker);

    this.logger.debug?.('Running worker', { workerName });
    // await worker.run();
  }

  private async start(): Promise<void> {
    for (const [key, handler] of this.getHandlers().entries()) {
      await this.createWorker(key, handler);

      // console.log({
      //   workerName,
      //   worker,
      // });

      // // Store in case we want to unwrap
      // // this.workers.set(workerName, worker);
    }
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

      await this.start();

      // this.worker = await Worker.create({
      //   ...this.opts.worker,
      //   connection: this.connection,
      // });

      // this.logger.debug?.('Running Temporal Worker');
      // await this.worker.run();
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
    if (!this.connection || !this.workers) {
      throw new Error(
        'Not initialized. Please call the "connect" method first.',
      );
    }
    return { connection: this.connection, workers: this.workers } as T;
  }
}
