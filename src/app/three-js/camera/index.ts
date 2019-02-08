import { NgModule } from '@angular/core';
import { PerspectiveCameraDir } from './perspective.dir';
const exports =
[
  PerspectiveCameraDir,
];
@NgModule
({
  exports,
  declarations: exports,
})
export class CameraMod {}
export * from './a';
export * from './perspective.dir';
