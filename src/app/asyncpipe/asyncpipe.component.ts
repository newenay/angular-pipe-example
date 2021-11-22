import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
/* https://angular.io/guide/observables-in-angular */

import { ZuluDateTimeFormatPipe } from '../shared/zulu-date-time-pipe/zulu-date-time-pipe';

@Component({
  selector: 'app-asyncpipe',
  templateUrl: './asyncpipe.component.html',
  styleUrls: ['./asyncpipe.component.css']
})
export class AsyncpipeComponent implements OnInit {
  
  time = new Observable<string>(observer => {
    setInterval(() => observer.next(new Date().toString()), 1000);
  });

  // transform(dateIn, 'timestamp')
  zulu = new Observable<string>(observer => {
    setInterval(() => observer.next(ZuluDateTimeFormatPipe.prototype.transform( new Date() )), 1000);
  });

  constructor( ) { }

  ngOnInit(): void { 
    
  }

}
