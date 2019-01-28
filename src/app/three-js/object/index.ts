import { NgModule } from '@angular/core';
import { BoneDir } from './bone.dir';
import { MeshDir } from './mesh.dir';
import { SkeletonDir } from './skeleton.dir';
import { SkinnedMeshDir } from './skinned-mesh.dir';
import { GroupDir } from './group.dir';

const exports =
[
  BoneDir,
  MeshDir,
  SkinnedMeshDir,
  SkeletonDir,
  GroupDir,
];
@NgModule
({
  exports,
  declarations: exports,
})
export class ObjectMod {}
export * from './bone.dir';
export * from './mesh.dir';
export * from './group.dir';
export * from './skeleton.dir';
