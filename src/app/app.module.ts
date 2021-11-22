import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { ObserverComponent } from './observer/observer.component';
import { EventEmitterComponent } from './event-emitter/event-emitter.component';
import { AsyncpipeComponent } from './asyncpipe/asyncpipe.component';
import { AppRoutingModule } from './app-routing.module';
import { PromiseComponent } from './promise/promise.component';
import { HttpClientModule } from '@angular/common/http';
// How is this a 'Shared_Module' exactly?

// Supposedly it must still be imported by the child so that it will work on the grandchild??
import { ZuluDateTimePipePublicModule } from './shared/zulu-date-time-pipe/zulu-date-time-pipe-public.module';


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
    HttpClientModule,
    ZuluDateTimePipePublicModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
