import { NgModule } from '@angular/core';
import { MeshDir } from './mesh.dir';
import { GroupDir } from './group.dir';

const exports =
[
  MeshDir,
  GroupDir,
];
@NgModule
( {
  exports,
  declarations: exports,
} )
export class ObjectMod {}

export * from './mesh.dir';
export * from './group.dir';
