import { DateTime } from 'luxon';

import { objectKeyForValue } from './main';

// See https://basarat.gitbooks.io/typescript/content/docs/types/literal-types.html
function strEnum<T extends string>(o: Array<T>): { [K in T]: K } {
  return o.reduce((res, key) => {
    res[key] = key;
    return res;
  }, Object.create(null));
}

export const Schedule = strEnum([
  'yearly',
  'monthly',
  'daily',
]);

export type Schedule = keyof typeof Schedule;

export type DateInput = Date | DateTime | string; // ISO Formatted only

export interface RepeatableEventOptions {
  label?: string;
}

export class RepeatableEvent {
  public date: DateTime;
  public label?: string;
  protected schedule: Schedule;
  
  private ancestors: RepeatableEvent[] = [];
  private originalOptions: RepeatableEventOptions;

  constructor(
    date: DateInput,
    schedule: Schedule,
    options: RepeatableEventOptions = {}
  ) {
    this.setDate(date)
    this.setSchedule(schedule);
    this.originalOptions = options;
    this.label = options.label;
  }

  public next() {
    const next = new RepeatableEvent(this.nextDateTime(), this.schedule, this.originalOptions);
    next.ancestors = next.ancestors.concat(this.ancestors, this);
    return next;
  }

  public nextDateTime(): DateTime {
    return this.getDateTimeIterator().next().value;
  }

  public numRepeatsUntil(date: DateInput): number {
    const endingDate = this.getDateTimeFromInput(date);
    let times = 0;
    if (this.cannotRepeatBeforeEndingDate(endingDate)) {
      return times;
    }
    const iterator = this.getDateTimeIterator(endingDate);
    let done = false;
    while (!done) {
      done = iterator.next().done;
      times++;
    }
    return times;
  }

  public clone() {
    const clone = new RepeatableEvent(this.date, this.schedule, this.originalOptions);
    clone.ancestors = this.ancestors;
    return clone;
  }

  public isIterationOf(original: RepeatableEvent) {
    this.validateIsRepeatable(original);
    return this.ancestors.indexOf(original) > -1;
  }

  private canRepeatBeforeEndingDate(endingDate: DateTime): boolean {
    const iterator = this.getDateTimeIterator(endingDate);
    return iterator.next().value <= endingDate;
  }

  private cannotRepeatBeforeEndingDate(endingDate: DateTime): boolean {
    return !this.canRepeatBeforeEndingDate(endingDate);
  }

  private getDateTimeIterator(endingDate?: DateTime): IterableIterator<DateTime> {
    if (endingDate && this.date > endingDate) {
      throw new Error('The date given was before the current date')
    }
    const conversions = {
      years: Schedule.yearly,
      months: Schedule.monthly,
      days: Schedule.daily,
    }
    const addObj = {};
    const addKey = objectKeyForValue(this.schedule, conversions) as string;
    addObj[addKey] = 1;
    let date = this.date;
    return (function* () {
      while (true) {
        date = date.plus(addObj);
        if (endingDate && date.plus(addObj) > endingDate) {
          return date;
        } else {
          yield date;
        }
      }
    })();
  }

  private setSchedule(schedule: Schedule) {
    this.validateSetScheduleInput(schedule);
    this.schedule = schedule;
  }

  private setDate(date: DateInput) {
    this.validateDateInput(date);
    this.date = this.getDateTimeFromInput(date);
  }

  private getDateTimeFromInput(input: DateInput): DateTime {
    this.validateDateInput(input);
    if (typeof input === 'string') return DateTime.fromISO(input);
    if (input instanceof Date) return DateTime.fromJSDate(input);
    return input;
  }

  private validateIsRepeatable(repeatable: RepeatableEvent) {
    if (!(repeatable instanceof RepeatableEvent)) {
      throw new Error('The argument given is not a RepeatableEvent')
    }
  }

  private validateSetScheduleInput(schedule: Schedule) {
    if (
      Object.keys(Schedule)
        .map(x => Schedule[x].toLowerCase())
        .indexOf(schedule.toLowerCase())
      === -1
    ) {
      throw new Error(`Invalid schedule type "${schedule}" given`);
    }
  }

  private validateDateInput(date: any): void {
    if (date instanceof Date) return;
    if (date instanceof DateTime) return;
    if (typeof date !== 'string') {
      throw new Error('The only valid options when setting a date are native js Date, Luxon DateTime, or a string (ISO format)');
    }
    const baseErrorMessage = 'When given a string, the only valid format is `yyyy-mm-dd`.'
    let errors: string[] = [];
    const regex = /([\d]{4})-([\d]{2})-([\d]{2})/
    if (!regex.test(date)) {
      throw new Error(baseErrorMessage)
    }
    const [_, year, month, day] = (date.match(regex) as RegExpMatchArray).map((part, i) => {
      if (i === 0) return part;
      return parseInt(part, 10);
    });
    if (month > 12 || month < 1) {
      errors.push(`The month, which should be 1 through 12, was given as ${month}.`);
    }
    if (day > 31 || day < 1) {
      errors.push(`The day, which should be 1 through 31, was given as ${day}.`);
    }
    if (errors.length > 0) {
      throw new Error(baseErrorMessage.concat(errors.join(' ')));
    }
  }
}