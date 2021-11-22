import { Pipe, PipeTransform } from '@angular/core';

// import { Constants } from '@shared/components/constants';
import { Constants } from '../constants';
import { formatDate } from '@angular/common';

type ZuluFormat = 'standard' | 'timestamp';

@Pipe({
    name: 'zuluDateTimeFormat'
})
export class ZuluDateTimeFormatPipe implements PipeTransform {

    transform(value: Date, format: ZuluFormat = 'standard'): string {
        if (format === 'timestamp') {
            return formatDate(value, Constants.timestampFormat, 'en', 'UTC').toUpperCase();
        }
        else {
            return formatDate(value, Constants.dateFormat, 'en', 'UTC');
        }
    }
}
