import { NgModule } from '@angular/core';
import { BoxBufferGeometryDir } from './box-buffer.dir';
import { SphereBufferGeometryDir } from './sphere-buffer.dir';
const exports =
[
  BoxBufferGeometryDir,
  SphereBufferGeometryDir,
];
@NgModule
({
  exports,
  declarations: exports,
})
export class GeometryMod {}
export * from './a';
export * from './sphere-buffer.dir';
export * from './box-buffer.dir';
