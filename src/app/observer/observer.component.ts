import { Component, OnInit } from '@angular/core';
// import { Observable, Observer } from 'rxjs';
/* https://angular.io/guide/observables */

@Component({
  selector: 'app-observer',
  templateUrl: './observer.component.html',
  styleUrls: ['./observer.component.css']
})
export class ObserverComponent implements OnInit {

  constructor() {
  }

  ngOnInit(): void { 
    
  }

  doSomething() {
    console.log("we will do something!")
  }

}
