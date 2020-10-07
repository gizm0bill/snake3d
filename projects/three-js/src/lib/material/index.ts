import { NgModule } from '@angular/core';
import { MeshBasicMaterialDir } from './basic.dir';
import { MeshLambertMaterialDir } from './lambert.dir';
import { MeshPhongMaterialDir } from './phong.dir';
import { MeshStandardMaterialDir } from './standard.dir';
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
export * from './basic.dir';
export * from './lambert.dir';
export * from './phong.dir';
export * from './standard.dir';
