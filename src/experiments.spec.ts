import { RepeatableEvent } from './experiments';

describe('RepeatableEvent', () => {
  describe('instantiation', () => {
    it('constructs with a starting date string', () => {
      expect(new RepeatableEvent('2001-01-01').startingDate).toEqual(new Date('2001-01-01'))
    })
  
    it('disallows strings other than yyyy-mm-dd', () => {
      expect(() => new RepeatableEvent('01-01').startingDate).toThrowError();
    })
  
    it('catches the simplest mistakes about the date string', () => {
      expect(() => new RepeatableEvent('2001-13-01').startingDate).toThrowError('13');
      expect(() => new RepeatableEvent('2001-10-32').startingDate).toThrowError('32');
    })
  
    it('constructs with a label', () => {
      expect(new RepeatableEvent('2001-01-01', 'My Event').label).toEqual('My Event');
    })
  })

  describe('setSchedule', () => {
    let repeatable: RepeatableEvent;
    beforeEach(() => repeatable = new RepeatableEvent('2001-01-01'));

    it('allows only certain strings', () => {
      expect(() => repeatable.setSchedule('monthly')).not.toThrow();
      expect(() => repeatable.setSchedule('monthlly')).toThrow();
    })
  })
});
