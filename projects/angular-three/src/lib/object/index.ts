import { NgModule } from '@angular/core';
import { MeshDir } from './mesh.dir';
import { GroupDir } from './group.dir';
import { LineDir } from './line.dir';
import { LineSegmentsDir } from './line-segments.dir';

const exports =
[
  MeshDir,
  LineDir,
  LineSegmentsDir,
  GroupDir,
];
@NgModule
( {
  exports,
  declarations: exports,
} )
export class ObjectMod {}

export * from './mesh.dir';
export * from './line.dir';
export * from './line-segments.dir';
export * from './group.dir';
