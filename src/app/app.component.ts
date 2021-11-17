import { Component, OnDestroy} from '@angular/core';
import { Subscription, of } from 'rxjs';

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

  // observer.component functions
  onOpen($event: any) {
    console.log('onOpen', $event);
  }

  onClose($event: any) {
    console.log('onClose', $event);
  }

// Create simple observable that emits three values
// const $myObservable = of(1, 2, 3);

  constructor(private messageService: MessageService) {
    // subscribe to home component messages
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

// Create observer object
/* const myObserver = {
  next: (x: number) => console.log('Observer got a next value: ' + x),
  error: (err: Error) => console.error('Observer got an error: ' + err),
  complete: () => console.log('Observer got a complete notification'),
}; */

// Execute with the observer object
// $myObservable.subscribe(myObserver);

// Logs:
// Observer got a next value: 1
// Observer got a next value: 2
// Observer got a next value: 3
// Observer got a complete notification
}