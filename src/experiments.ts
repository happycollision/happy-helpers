export enum Schedule {
  Monthly = 'monthly'
}

export class RepeatableEvent {
  public startingDate: Date;
  protected schedule: Schedule;

  constructor(
    startingDate: string | Date,
    public label?: string,
  ) {
    this.validateConstructorInput(startingDate);
    this.startingDate = new Date(startingDate);
  }

  setSchedule(schedule: Schedule) {
    this.validateSetScheduleInput(schedule);
    this.schedule = schedule;
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