import { RepeatableEvent, Schedule } from './repeatable-event';
import { DateTime } from 'luxon';

describe('RepeatableEvent', () => {
  describe('instantiation', () => {
    it('constructs with a starting date string', () => {
      expect(new RepeatableEvent('2001-01-01', 'monthly').date).toEqual(DateTime.fromISO('2001-01-01'))
    })
  
    it('disallows strings other than yyyy-mm-dd', () => {
      expect(() => new RepeatableEvent('01-01', 'monthly').date).toThrowError();
    })
  
    it('catches the simplest mistakes about the date string', () => {
      expect(() => new RepeatableEvent('2001-13-01', 'monthly').date).toThrowError('13');
      expect(() => new RepeatableEvent('2001-10-32', 'monthly').date).toThrowError('32');
    })
  
    it('constructs with a label', () => {
      expect(new RepeatableEvent('2001-01-01', 'monthly', {label: 'My Event'}).label).toEqual('My Event');
    })

    it('allows only certain schedules', () => {
      expect(() => new RepeatableEvent('2001-01-01', 'monthly')).not.toThrow();
      // @ts-ignore
      expect(() => new RepeatableEvent('2001-01-01', 'monthlly')).toThrowError('monthlly');
    })
  })

  describe('next', () => {
    it('returns a new RepeatableEvent', () => {
      const repeatable = new RepeatableEvent('2001-01-01', 'monthly');
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
        const repeatable = new RepeatableEvent('2001-01-01', schedule as Schedule);
        const endDate = DateTime.fromISO(dateStr);
        expect(repeatable.next().date).toEqual(endDate)
      })
    })
  })
});
