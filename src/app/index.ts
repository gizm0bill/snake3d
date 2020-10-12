import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { RoutingMod } from './routing.mod';
import { AppCom } from './com';
import { CommonModule } from '@angular/common';
import { DemoCom } from './demo.com';
import { AngularThreeMod } from 'angular-three';

@NgModule
({
  declarations: [ AppCom, DemoCom ],
  imports:
  [
    CommonModule,
    BrowserModule,
    AngularThreeMod,
    RoutingMod
  ],
  bootstrap: [ AppCom ]
})
export class AppMod { }
