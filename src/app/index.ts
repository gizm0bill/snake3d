import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { RoutingMod } from './routing.mod';
import { AppCom } from './com';
import { CommonModule } from '@angular/common';

@NgModule
({
  declarations: [ AppCom ],
  imports:
  [
    CommonModule,
    BrowserModule,
    RoutingMod
  ],
  bootstrap: [ AppCom ]
})
export class AppMod { }
