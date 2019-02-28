import { NgModule } from '@angular/core';
import { MeshLambertMaterialDir, MeshPhongMaterialDir, MeshBasicMaterialDir } from './mesh';
const impex =
[
  MeshLambertMaterialDir,
  MeshPhongMaterialDir,
  MeshBasicMaterialDir,
];
@NgModule
({
  declarations: impex,
  exports: impex,
})
export class MaterialMod {}
export * from './a';
export * from './mesh';
