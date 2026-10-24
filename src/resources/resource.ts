import type { Transport } from '../core.js';

/** Base class for the resource groups on a {@link BallotData} client. */
export abstract class Resource {
  /** @internal */
  protected readonly transport: Transport;

  /** @internal */
  constructor(transport: Transport) {
    this.transport = transport;
  }
}

/** Path segment, escaped. */
export function seg(value: string | number): string {
  return encodeURIComponent(String(value));
}
