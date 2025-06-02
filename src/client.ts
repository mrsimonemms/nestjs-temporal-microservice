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
import {
  Connection,
  Client as TemporalClient,
  Workflow,
  WorkflowHandleWithFirstExecutionRunId,
} from '@temporalio/client';
import { v4 as uuid } from 'uuid';

import { IClientConnectionOpts, ITemporalPacketData } from './interfaces';

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

  // Dispatch triggers a Temporal workflow and doesn't wait for the response.
  // This returns the workflow ID only
  async dispatchEvent(packet: ReadPacket<any>): Promise<any> {
    await Promise.resolve();
    return console.log('event to dispatch: ', packet);
  }

  // Publish triggers a Temporal workflow and waits for the response
  publish(
    packet: ReadPacket<unknown>,
    callback: (packet: WritePacket<unknown>) => void,
  ): () => void {
    if (!this.client) {
      throw new Error(
        'Not initialized. Please call the "listen"/"startAllMicroservices" method before accessing the server.',
      );
    }

    // ITemporalPacketData shouldn't be a Partial, but need to ensure that we have the right data
    const {
      taskQueue,
      workflowType,
      workflowId = `${taskQueue}_${uuid()}`,
    } = packet.pattern as Partial<ITemporalPacketData>;

    if (!workflowType) {
      throw new Error(
        'workflowType is a required field for a Temporal microservice',
      );
    }
    if (!taskQueue) {
      throw new Error(
        'taskQueue is a required field for a Temporal microservice',
      );
    }

    this.logger.debug('Starting Temporal microservice workflow', {
      workflowId,
      taskQueue,
      workflowType,
    });
    this.client.workflow
      .start(workflowType, {
        taskQueue,
        workflowId,
      })
      .then((handler: WorkflowHandleWithFirstExecutionRunId<Workflow>) => {
        this.logger.debug('Temporal workflow started', { workflowId });

        return handler.result();
      })
      .then((response: unknown) => {
        this.logger.debug('Temporal workflow resolved', { workflowId });
        callback({
          response,
          isDisposed: true,
        });
      })
      .catch((err: Error) => {
        this.logger.error('Temporal error', { err, workflowId });
        callback({ err });
      });

    return () => {
      this.logger.debug('Tearing down Temporal microservice');
    };
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
