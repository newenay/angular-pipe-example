import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
/* https://angular.io/guide/observables-in-angular */

@Component({
  selector: 'app-asyncpipe',
  templateUrl: './asyncpipe.component.html',
  styleUrls: ['./asyncpipe.component.css']
})
export class AsyncpipeComponent implements OnInit {
  // utcTime = new Date.UTC()
  time = new Observable<string>(observer => {
    setInterval(() => observer.next(new Date().toString()), 1000);
  });
  
  constructor( ) { }

  ngOnInit(): void { 
  }

}
