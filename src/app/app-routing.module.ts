import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ObserverComponent } from './observer/observer.component';

const routes: Routes = [
    { path: '', component: ObserverComponent },

    // otherwise redirect to home
    { path: '**', redirectTo: '' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
