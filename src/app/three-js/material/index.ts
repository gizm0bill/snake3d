import { NgModule } from '@angular/core';
import { MeshLambertMaterialDir, MeshPhongMaterialDir, MeshBasicMaterialDir, MeshStandardMaterialDir } from './mesh';
const impex =
[
  MeshLambertMaterialDir,
  MeshPhongMaterialDir,
  MeshBasicMaterialDir,
  MeshStandardMaterialDir,
];
@NgModule
({
  declarations: impex,
  exports: impex,
})
export class MaterialMod {}
export * from './a';
export * from './mesh';
