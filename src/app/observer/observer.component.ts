import { Component, OnInit, EventEmitter, Output } from '@angular/core';
/* https://angular.io/guide/observables-in-angular */

@Component({
  selector: 'app-observer',
  templateUrl: './observer.component.html',
  styleUrls: ['./observer.component.css']
})
export class ObserverComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  doSomething() {
    console.log("we will do something!")
  }

}
