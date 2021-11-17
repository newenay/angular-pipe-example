import { Component } from '@angular/core';
import { Observable, of} from 'rxjs';
// import { map, filter, tap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Angular Pipe Example';
  
  // observer.component functions
  onOpen($event: any) {
    console.log('onOpen', $event);
  }

  onClose($event: any) {
    console.log('onClose', $event);
  }
}

// Create simple observable that emits three values
const $myObservable = of(1, 2, 3);

// Create observer object
const myObserver = {
  next: (x: number) => console.log('Observer got a next value: ' + x),
  error: (err: Error) => console.error('Observer got an error: ' + err),
  complete: () => console.log('Observer got a complete notification'),
};

// Execute with the observer object
$myObservable.subscribe(myObserver);

// Logs:
// Observer got a next value: 1
// Observer got a next value: 2
// Observer got a next value: 3
// Observer got a complete notification