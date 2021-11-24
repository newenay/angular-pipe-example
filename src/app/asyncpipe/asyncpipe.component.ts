import { Component, OnInit } from '@angular/core';
import { Subject, Subscription, timer } from 'rxjs';
import { map, share } from "rxjs/operators";
/* 
https://angular.io/guide/observables-in-angular 
Clocks
https://stackblitz.com/edit/angular-ihpcnz
*/

// import { ZuluDateTimeFormatPipe } from '../shared/zulu-date-time-pipe/zulu-date-time-pipe';

@Component({
  selector: 'app-asyncpipe',
  templateUrl: './asyncpipe.component.html',
  styleUrls: ['./asyncpipe.component.css']
})
export class AsyncpipeComponent implements OnInit {
  /* https://stackoverflow.com/questions/948532/how-do-you-convert-a-javascript-date-to-utc/11957822#11957822 */
  time = new Date().toISOString();
  rxTime = new Date().toISOString();
  intervalId: any;
  unsubscribe$ = new Subject<void>();
  subscription: Subscription[] = [];

  constructor( ) { }

  ngOnInit(): void { 

    // Using Basic Interval
    this.intervalId = setInterval(() => {
      this.time = new Date().toISOString();
    }, 1000);

    // Using RxJS Timer
    this.subscription.push(timer(0, 1000)
      .pipe(
        map(() => new Date()),
        share()
      )
      .subscribe(time => {
        this.rxTime = time.toISOString();
      })
    );
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}
