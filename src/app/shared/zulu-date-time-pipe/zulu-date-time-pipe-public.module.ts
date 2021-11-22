import { NgModule } from '@angular/core';
// makes it all Common or whatever
import { CommonModule } from '@angular/common';
import {ZuluDateTimeFormatPipe} from './zulu-date-time-pipe';


@NgModule({
  // the Shared_Component
  declarations: [ZuluDateTimeFormatPipe],
  exports: [ZuluDateTimeFormatPipe],
  providers: [ZuluDateTimeFormatPipe],
  imports: [
    CommonModule,
  ]
})
// the Shared_Module
export class ZuluDateTimePipePublicModule { }
