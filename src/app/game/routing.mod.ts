import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MainCom } from './main.com';
import { TestCom } from './test.com';

const routes: Routes =
[
  { path: '', component: MainCom },
  { path: 'test', component: TestCom },
];

@NgModule
({
  imports: [ RouterModule.forChild( routes ) ],
  exports: [ RouterModule ]
})
export class RoutingMod { }
