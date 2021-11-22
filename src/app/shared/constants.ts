export class Constants {
    /**
     * Date format that is common throughout MADSS. Value is equivalent to 'dd HHmm\'Z\' LLL yyyy', or '01 1732Z Jul 2019'
     */
    static readonly dateFormat: string = 'dd HHmm\'Z\' LLL yyyy';

    /**
     * Date format used for zulu timestamps with specificity down to miliseconds
     */
    static readonly timestampFormat: string = 'yyyy-MM-ddTHH:mm:SSS\'Z\'';
}
