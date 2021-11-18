import { Component } from '@angular/core';
import { MessageService } from '../_services';
/* 
https://stackblitz.com/edit/angular-10-communicating-between-components?file=src%2Fapp%2Fapp-routing.module.ts
https://angular.io/guide/observables 
*/

@Component({
  selector: 'app-observer',
  templateUrl: './observer.component.html',
  styleUrls: ['./observer.component.css']
})
export class ObserverComponent {

  constructor(private messageService: MessageService) { }

  sendMessage(): void {
      // send message to subscribers via observable subject
      this.messageService.sendMessage('Msg from Observer Component to App !');
  }

  clearMessages(): void {
      // clear messages
      this.messageService.clearMessages();
  }
  
  /* doSomething() {
    console.log("we will do something!")
  } */

}
