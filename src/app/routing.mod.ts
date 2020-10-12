import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { environment } from 'src/environments/environment';
import { DemoCom } from './demo.com';

const routes: Routes =
[
  { path: '', redirectTo: 'game', pathMatch: 'full' },
  { path: 'game', loadChildren: () => import('./game').then(m => m.GameMod) },
  { path: 'demo', component: DemoCom }
];

@NgModule
({
  imports:
  [
    RouterModule.forRoot( routes,
    {
      enableTracing: !environment.production,
      preloadingStrategy: PreloadAllModules
    })
  ],
  exports: [ RouterModule ]
})
export class RoutingMod { }
