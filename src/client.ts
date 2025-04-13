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
import { ClientProxy, ReadPacket, WritePacket } from '@nestjs/microservices';

export class TemporalPubSubClient extends ClientProxy {
  async connect(): Promise<any> {
    await Promise.resolve();
    console.log('connect');
  }

  async close() {
    await Promise.resolve();
    console.log('close');
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
    setTimeout(() => callback({ response: packet.data }), 5000);

    console.log(callback);

    return () => console.log('teardown');
  }

  unwrap<T = never>(): T {
    throw new Error('Method not implemented.');
  }
}
