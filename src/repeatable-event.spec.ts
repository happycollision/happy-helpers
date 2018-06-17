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

  describe('clone', () => {
    it('preserves everything', () => {
      expect(createRepeatable().clone()).toMatchObject(createRepeatable())
    })
  })

  describe('nextDateTime', () => {
    [
      ['monthly', '2001-02-01'],
      ['daily', '2001-01-02'],
      ['yearly', '2002-01-01'],
    ].forEach(([schedule, dateStr]) => {
      it(`returns a DateTime correctly for the ${schedule} schedule`, () => {
        const repeatable = createRepeatable({ date: '2001-01-01', schedule: schedule as Schedule });
        const endDate = DateTime.fromISO(dateStr);
        expect(repeatable.nextDateTime()).toEqual(endDate)
      })
    })
  })

  describe('numRepeatsUntil', () => {
    it('returns the number of complete repeats until a given date', () => {
      const repeatable = createRepeatable({ date: '2001-01-01', schedule: 'daily' });
      expect(repeatable.numRepeatsUntil('2001-01-02')).toEqual(1);
      expect(repeatable.numRepeatsUntil('2001-01-03')).toEqual(2);
      expect(repeatable.numRepeatsUntil('2001-01-04')).toEqual(3);
      expect(repeatable.numRepeatsUntil('2002-01-01')).toEqual(365);
    })

    it('returns 0 if given date does not allow a full repeat', () => {
      const repeatable = createRepeatable({ date: '2001-01-01', schedule: 'monthly' });
      expect(repeatable.numRepeatsUntil('2001-01-03')).toEqual(0);
    })

    it('throws if date given is before the date of the repeatable', () => {
      const repeatable = createRepeatable({ date: '2001-01-01', schedule: 'daily' });
      expect(() => repeatable.numRepeatsUntil('2000-01-01')).toThrow();
    })
  })

  describe('repeatUntil', () => {
    it('returns Repeatables with the correct dates', () => {
      const repeatable = createRepeatable({ date: '2001-01-01', schedule: 'daily' });
      const repeats = repeatable.repeatUntil('2001-01-05');
      const expectedDates = ['2001-01-02', '2001-01-03', '2001-01-04', '2001-01-05'].map(x => DateTime.fromISO(x))
      expect(repeats.map(x => x instanceof RepeatableEvent)).toEqual([true, true, true, true]);
      expect(repeats.map(x => x.date)).toEqual(expectedDates);
    })

    it('throws if date given is before the date of the repeatable', () => {
      const repeatable = createRepeatable({ date: '2001-01-01', schedule: 'daily' });
      expect(() => repeatable.numRepeatsUntil('2000-01-01')).toThrow();
    })
  })

  describe('`onRepeat` side effects', () => {
    it('can register a function that is called on `next()`', () => {
      const mock = jest.fn();
      const parent = createRepeatable();
      parent.onRepeat(mock);
      const child = parent.next();
      expect(mock).toHaveBeenCalledWith({ from: parent, to: child });
    })

    it('registered function is called on *every* `next()`', () => {
      const mock = jest.fn();
      const parent = createRepeatable();
      parent.onRepeat(mock);
      const child = parent.next();
      const grandchild = child.next();
      expect(mock).toHaveBeenCalledTimes(2);
      expect(mock).toHaveBeenCalledWith({ from: parent, to: child });
      expect(mock).toHaveBeenCalledWith({ from: child, to: grandchild });
    })

    it('allows functions to be added at any level', () => {
      const mock1 = jest.fn();
      const mock2 = jest.fn();
      const parent = createRepeatable();
      parent.onRepeat(mock1);
      const child = parent.next();
      child.onRepeat(mock2);
      const grandchild = child.next();
      expect(mock1).toHaveBeenCalledTimes(2);
      expect(mock2).toHaveBeenCalledTimes(1);
      expect(mock1).toHaveBeenCalledWith({ from: parent, to: child });
      expect(mock1).toHaveBeenCalledWith({ from: child, to: grandchild });
      expect(mock2).toHaveBeenCalledWith({ from: child, to: grandchild });
    })
  })

  describe('isIterationOf', () => {
    it('returns true if it is a descendent of another RepeatableEvent', () => {
      const first = createRepeatable();
      const second = first.next();
      expect(second.isIterationOf(first)).toEqual(true);
      expect(second.next().isIterationOf(first)).toEqual(true);
    })

    it('returns true even on a cloned instance', () => {
      const first = createRepeatable();
      const second = first.next().clone();
      expect(second.isIterationOf(first)).toEqual(true);
      expect(second.next().isIterationOf(first)).toEqual(true);
    })

    it('returns false for a repeatable that is not an ancestor', () => {
      const first = createRepeatable();
      const second = createRepeatable().next();
      expect(second.isIterationOf(first)).toEqual(false);
    })

    it('throws when a non-repeatable is given to the method', () => {
      // @ts-ignore
      expect(() => createRepeatable().isIterationOf({})).toThrow()
    })
  })
});
