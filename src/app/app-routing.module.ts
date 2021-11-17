import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ObserverComponent } from './observer/observer.component';
import { EventEmitterComponent } from './event-emitter/event-emitter.component';
import { AsyncpipeComponent} from './asyncpipe/asyncpipe.component';

const routes: Routes = [
    { path: '', component: ObserverComponent },
    { path: '', component: EventEmitterComponent },
    { path: '', component: AsyncpipeComponent },

    // otherwise redirect to home
    { path: '**', redirectTo: '' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
