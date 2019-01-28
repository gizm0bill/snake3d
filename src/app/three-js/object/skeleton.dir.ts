import
{
  QueryList,
  Directive,
  ContentChildren,
  AfterContentInit,
} from '@angular/core';
import * as THREE from 'three';
import { AObject3D } from '../object-3d';
import { BoneDir } from './bone.dir';

@Directive
({
  selector: 'three-skeleton',
})
export class SkeletonDir implements AfterContentInit
{
  @ContentChildren(BoneDir) bones: QueryList<BoneDir>;
  object: THREE.Skeleton;

  private buildSkeleton( bones: THREE.Bone[] )
  {
    this.object = new THREE.Skeleton( bones );
  }
  ngAfterContentInit()
  {
    this.buildSkeleton( this.bones.map( bone => bone.object ) );
    // this.bones.changes.subscribe( () => { debugger; } );
  }
}
