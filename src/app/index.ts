import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { RoutingMod } from './routing.mod';
import { AppCom } from './com';

@NgModule
({
  declarations:
  [
    AppCom
  ],
  imports:
  [
    BrowserModule,
    RoutingMod
  ],
  providers: [],
  bootstrap: [ AppCom ]
})
export class AppMod { }
