import type { Clock } from "../core/index";

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
