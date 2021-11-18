import { Component, OnDestroy} from '@angular/core';
import { Subscription } from 'rxjs';
import { MessageService } from './_services';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnDestroy {
  title = 'Angular Pipe Example';
  
  messages: any[] = [];
  subscription: Subscription;

  /******* event-emitter.component functions ********/
  onOpen($event: any) {
    console.log('onOpen', $event);
  }

  onClose($event: any) {
    console.log('onClose', $event);
  }
  /***********************************/

  constructor(private messageService: MessageService) {
    // subscribe to observer component messages
    this.subscription = this.messageService.onMessage().subscribe(message => {
        if (message) {
            this.messages.push(message);
        } else {
            // clear messages when empty message received
            this.messages = [];
        }
    });
  }

  ngOnDestroy() {
    // unsubscribe to ensure no memory leaks
    this.subscription.unsubscribe();
  }

}