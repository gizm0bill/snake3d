import { NgModule } from '@angular/core';
import { MeshLambertMaterialDir } from './mesh';
const impex =
[
  MeshLambertMaterialDir,
];
@NgModule
({
  declarations: impex,
  exports: impex,
})
export class MaterialMod {}
export * from './a';
export * from './mesh';
