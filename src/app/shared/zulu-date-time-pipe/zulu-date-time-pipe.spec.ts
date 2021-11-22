import { ZuluDateTimeFormatPipe } from './zulu-date-time-pipe';

const DATE_UNIX_EPOCH = new Date('1970-01-01T00:00:00.000+00:00');
const DATE_GREAT_SCOTT = new Date('2015-10-10T16:30:00.000+00:00');
const DATE_UTC = new Date('2077-07-04T13:42:09.320+00:00');
const DATE_EST = new Date('2077-07-04T13:42:09.320+05:00');

describe('zulu-date-time-pipe', () => {

  describe('Zulu "standard" format', () => {
    [
      { dateIn: DATE_UNIX_EPOCH,  expectedDate: '01 0000Z Jan 1970' },
      { dateIn: DATE_GREAT_SCOTT, expectedDate: '10 1630Z Oct 2015' },
      { dateIn: DATE_UTC,         expectedDate: '04 1342Z Jul 2077' },
      { dateIn: DATE_EST,         expectedDate: '04 0842Z Jul 2077' },
    ].forEach(({ dateIn, expectedDate }) => {
      it(`Pipe input of ${dateIn.toISOString()} should transfom to ${expectedDate}`, () => {
        expect(ZuluDateTimeFormatPipe.prototype.transform(dateIn)).toEqual(expectedDate);
      });
    });
  });

  describe('Zulu timestamp format', () => {
    [
      { dateIn: DATE_UNIX_EPOCH,  expectedDate: '1970-01-01T00:00:000Z' },
      { dateIn: DATE_GREAT_SCOTT, expectedDate: '2015-10-10T16:30:000Z' },
      { dateIn: DATE_UTC,         expectedDate: '2077-07-04T13:42:320Z' },
      { dateIn: DATE_EST,         expectedDate: '2077-07-04T08:42:320Z' },
    ].forEach(({ dateIn, expectedDate }) => {
      it(`Pipe input of ${dateIn.toISOString()} should transfom to timestamp ${expectedDate}`, () => {
        expect(ZuluDateTimeFormatPipe.prototype.transform(dateIn, 'timestamp')).toEqual(expectedDate);
      });
    });
  });
});
