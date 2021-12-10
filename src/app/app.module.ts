import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FormsModule } from "@angular/forms";

import { AppComponent } from './app.component';
import { ObserverComponent } from './observer/observer.component';
import { EventEmitterComponent } from './event-emitter/event-emitter.component';
import { AsyncpipeComponent } from './asyncpipe/asyncpipe.component';
import { AppRoutingModule } from './app-routing.module';
import { PromiseComponent } from './promise/promise.component';
import { HttpClientModule } from '@angular/common/http';

import { ModalComponent } from './modal/modal.component';
import { HelloComponent } from "./modal/hello.component";
import { ModalModule } from 'ngx-bootstrap/modal';

// Supposedly it must still be imported by the child so that it will work on the grandchild??
// import { SharedPublicModule } from './shared/...';

@NgModule({
  declarations: [
    AppComponent,
    ObserverComponent,
    EventEmitterComponent,
    AsyncpipeComponent,
    PromiseComponent,
    ModalComponent,
    HelloComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    FormsModule,
    ModalModule.forRoot() 
    //SharedPublicModule
  ],
  providers: [],
  entryComponents: [HelloComponent],
  bootstrap: [AppComponent]
})
export class AppModule { }
