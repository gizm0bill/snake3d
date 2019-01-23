import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { environment } from 'src/environments/environment';

const routes: Routes =
[
  { path: '', redirectTo: 'game', pathMatch: 'full' },
  { path: 'game', loadChildren: './game#GameMod' }
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
