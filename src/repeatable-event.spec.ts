import { RepeatableEvent, Schedule, DateInput } from './repeatable-event';
import { DateTime } from 'luxon';

function createRepeatable(overrides: {date?: DateInput, schedule?: Schedule, label?: string} = {}): RepeatableEvent {
  const {date, schedule, label} = overrides;
  const settings = {
    date: date || '2001-01-01',
    schedule: schedule || 'monthly',
    options: label ? {label} : undefined,
  };
  return new RepeatableEvent(settings.date, settings.schedule, settings.options);
}

describe('RepeatableEvent', () => {
  describe('instantiation', () => {
    it('constructs with a starting date string', () => {
      expect(createRepeatable({date: '2001-01-01'}).date).toEqual(DateTime.fromISO('2001-01-01'))
    })
  
    it('disallows strings other than yyyy-mm-dd', () => {
      
      expect(() => createRepeatable({ date: '01-01' }).date).toThrowError();
    })
  
    it('catches the simplest mistakes about the date string', () => {
      expect(() => createRepeatable({ date: '2001-13-01' }).date).toThrowError('13');
      expect(() => createRepeatable({ date: '2001-10-32' }).date).toThrowError('32');
    })
  
    it('constructs with a label', () => {
      expect(createRepeatable({ label: 'My Event' }).label).toEqual('My Event');
    })

    it('throws with a bad schedule', () => {
      // @ts-ignore
      expect(() => createRepeatable({ schedule: 'monthlly' })).toThrowError('monthlly');
    })
  })

  describe('next', () => {
    it('returns a new RepeatableEvent', () => {
      const repeatable = createRepeatable();
      const next = repeatable.next();
      expect(next).toBeInstanceOf(RepeatableEvent);
      expect(next).not.toBe(repeatable);
    });

    [
      ['monthly', '2001-02-01'],
      ['daily', '2001-01-02'],
      ['yearly', '2002-01-01'],
    ].forEach(([schedule, dateStr]) => {
      it(`correctly identifies the next date based on a ${schedule} schedule`, () => {
        const repeatable = createRepeatable({ date: '2001-01-01', schedule: schedule as Schedule });
        const endDate = DateTime.fromISO(dateStr);
        expect(repeatable.next().date).toEqual(endDate)
      })
    })

    it('preserves settings on each iteration', () => {
      expect(createRepeatable({schedule: 'daily', label: 'my label'}).next())
      .toMatchObject({schedule: 'daily', label: 'my label'})
    })
  })
});
