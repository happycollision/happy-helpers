import { RepeatableEvent } from './experiments';
import { DateTime } from 'luxon';

describe('RepeatableEvent', () => {
  describe('instantiation', () => {
    it('constructs with a starting date string', () => {
      expect(new RepeatableEvent('2001-01-01').startingDate).toEqual(DateTime.fromISO('2001-01-01'))
    })
  
    it('disallows strings other than yyyy-mm-dd', () => {
      expect(() => new RepeatableEvent('01-01').startingDate).toThrowError();
    })
  
    it('catches the simplest mistakes about the date string', () => {
      expect(() => new RepeatableEvent('2001-13-01').startingDate).toThrowError('13');
      expect(() => new RepeatableEvent('2001-10-32').startingDate).toThrowError('32');
    })
  
    it('constructs with a label', () => {
      expect(new RepeatableEvent('2001-01-01', {label: 'My Event'}).label).toEqual('My Event');
    })
  })

  describe('setSchedule', () => {
    let repeatable: RepeatableEvent;
    beforeEach(() => repeatable = new RepeatableEvent('2001-01-01'));

    it('allows only certain strings', () => {
      expect(() => repeatable.setSchedule('monthly')).not.toThrow();
      // @ts-ignore
      expect(() => repeatable.setSchedule('monthlly')).toThrowError('monthlly');
    })
  })

  describe('next', () => {
    let repeatable: RepeatableEvent;
    beforeEach(() => repeatable = new RepeatableEvent('2001-01-01'))

    it('correctly identifies the next date based on the schedule', () => {
      repeatable.setSchedule('monthly');
      const endDate = DateTime.fromISO('2001-02-01');
      expect(repeatable.next().date).toEqual(endDate)
    })
  })
});
