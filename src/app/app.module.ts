import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { ObserverComponent } from './observer/observer.component';
import { EventEmitterComponent } from './event-emitter/event-emitter.component';
import { AsyncpipeComponent } from './asyncpipe/asyncpipe.component';

@NgModule({
  declarations: [
    AppComponent,
    ObserverComponent,
    EventEmitterComponent,
    AsyncpipeComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
