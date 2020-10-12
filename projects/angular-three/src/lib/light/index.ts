import { NgModule } from '@angular/core';
import { PointLightDir } from './point.dir';
import { AmbientLightDir } from './ambient.dir';
const exports =
[
  PointLightDir,
  AmbientLightDir,
];
@NgModule
({
  exports,
  declarations: exports,
})
export class LightMod {}
export * from './a';
export * from './point.dir';
export * from './ambient.dir';
