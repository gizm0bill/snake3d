import { NgModule } from '@angular/core';
import { BoxBufferGeometryDir } from './box-buffer.dir';
const exports =
[
  BoxBufferGeometryDir,
];
@NgModule
({
  exports,
  declarations: exports,
})
export class GeometryMod {}
export * from './a';
export * from './box-buffer.dir';
