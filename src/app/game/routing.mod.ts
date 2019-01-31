import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MainCom } from './main.com';

const routes: Routes =
[
  { path: '', component: MainCom },
];

@NgModule
({
  imports: [ RouterModule.forChild( routes ) ],
  exports: [ RouterModule ]
})
export class RoutingMod { }
