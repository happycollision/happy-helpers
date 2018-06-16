import { DateTime } from 'luxon';

// See https://basarat.gitbooks.io/typescript/content/docs/types/literal-types.html
function strEnum<T extends string>(o: Array<T>): { [K in T]: K } {
  return o.reduce((res, key) => {
    res[key] = key;
    return res;
  }, Object.create(null));
}

export const Schedule = strEnum([
  'monthly',
]);

export type Schedule = keyof typeof Schedule;

export type DateInput = Date | DateTime | string; // ISO Formatted only

export class RepeatableEvent {
  public startingDate: DateTime;
  public label: string;
  protected schedule: Schedule;

  constructor(
    startingDate: DateInput,
    options: {label?: string, schedule?: Schedule} = {}
  ) {
    this.validateConstructorInput(startingDate);
    this.setStartingDate(startingDate)
    this.label = options.label;
    this.setSchedule(options.schedule);
  }

  setSchedule(schedule: Schedule | null) {
    if (!schedule) return;
    this.validateSetScheduleInput(schedule);
    this.schedule = schedule;
  }

  private setStartingDate(ctorInputDate: DateInput) {
    this.startingDate = this.getDateTimeFromInput(ctorInputDate);
  }

  private getDateTimeFromInput(input: DateInput): DateTime {
    this.validateConstructorInput(input);
    if (typeof input === 'string') return DateTime.fromISO(input);
    if (input instanceof Date) return DateTime.fromJSDate(input);
    return input;
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

  private validateConstructorInput(startingDate): void {
    if (startingDate instanceof Date) return;
    const baseErrorMessage = 'The constructor for RepeatableEvent will only take a string with the format `yyyy-mm-dd`.'
    let errorMessage: string; 
    if (startingDate instanceof DateTime) return;
    if (typeof startingDate !== 'string') {
      throw new Error('The only valid options when setting a date are native js Date, Luxon DateTime, or a string (ISO format)');
    }
    const regex = /([\d]{4})-([\d]{2})-([\d]{2})/
    if (!regex.test(startingDate)) {
      throw new Error(baseErrorMessage)
    }
    const [_, year, month, day] = startingDate.match(regex).map((part, i) => {
      if (i === 0) return part;
      return parseInt(part, 10);
    });
    if (month > 12 || month < 1) {
      errorMessage = `${errorMessage} The month, which should be 1 through 12, was given as ${month}.`
    }
    if (day > 31 || day < 1) {
      errorMessage = `${errorMessage} The day, which should be 1 through 31, was given as ${day}.`
    }
    if (errorMessage) {
      throw new Error(`${baseErrorMessage} ${errorMessage}`)
    }
  }
}