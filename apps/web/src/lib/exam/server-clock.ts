/**
 * The exam deadline is decided by the server. The browser only counts down between syncs, using a monotonic clock
 * (`performance.now`) so changing the device clock cannot add time. Every save response re-syncs it.
 */
export class ServerClock {
  private deadlineMono = 0;
  private serverNowAtSync = 0;
  private monoAtSync = 0;

  constructor(private readonly mono: () => number = () => performance.now()) {}

  /** `serverTimeIso` and `remainingSec` come from the same server response. */
  sync(serverTimeIso: string, remainingSec: number) {
    this.monoAtSync = this.mono();
    this.serverNowAtSync = Date.parse(serverTimeIso);
    this.deadlineMono = this.monoAtSync + remainingSec * 1000;
  }

  remainingMs(): number {
    return Math.max(0, this.deadlineMono - this.mono());
  }

  remainingSec(): number {
    return Math.ceil(this.remainingMs() / 1000);
  }

  /** Best estimate of the server's current time. */
  serverNow(): number {
    return this.serverNowAtSync + (this.mono() - this.monoAtSync);
  }

  /** Seconds until a server timestamp (e.g. the end of a section window). */
  secondsUntil(iso: string): number {
    return Math.max(0, Math.ceil((Date.parse(iso) - this.serverNow()) / 1000));
  }
}
