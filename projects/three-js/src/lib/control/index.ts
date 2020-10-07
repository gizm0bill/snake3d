import { NgModule } from '@angular/core';
import { OrbitControlsDir } from './orbit.dir';
const exports =
[
  OrbitControlsDir,
];
@NgModule
({
  exports,
  declarations: exports,
})
export class ControlMod {}
export * from './orbit.dir';
