import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { ObserverComponent } from './observer/observer.component';
import { EventEmitterComponent } from './event-emitter/event-emitter.component';
import { AsyncpipeComponent } from './asyncpipe/asyncpipe.component';
import { AppRoutingModule } from './app-routing.module';
import { PromiseComponent } from './promise/promise.component';
import { HttpClientModule, HttpClient } from '@angular/common/http';


@NgModule({
  declarations: [
    AppComponent,
    ObserverComponent,
    EventEmitterComponent,
    AsyncpipeComponent,
    PromiseComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
