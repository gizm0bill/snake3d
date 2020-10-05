import { Directive, AfterViewInit, forwardRef, ContentChild } from '@angular/core';
import * as THREE from 'three';
import { AObject3D } from '../object-3d';
import { AMaterial } from '../material';
import { AGeometry } from '../geometry';
import { SkeletonDir } from './skeleton.dir';
import { SkinnedMesh, MeshBasicMaterial } from 'three';

@Directive
({
  selector: 'three-skinned-mesh',
  exportAs: 'threeSkinnedMesh',
  providers: [{ provide: AObject3D, useExisting: forwardRef( () => SkinnedMeshDir ) }]
})
export class SkinnedMeshDir extends AObject3D<SkinnedMesh> implements AfterViewInit
{
  @ContentChild(AGeometry, /* TODO: add static flag */ {}) geometry: AGeometry<any>;
  @ContentChild(AMaterial, /* TODO: add static flag */ {}) material: AMaterial<any>;
  @ContentChild(SkeletonDir, /* TODO: add static flag */ {}) skeleton: SkeletonDir;

  ngAfterViewInit()
  {
    this._object = new SkinnedMesh
    (
      this.geometry.object,
      this.material && this.material.object || new MeshBasicMaterial({ color: 0xff00ff })
    );
    this._object.bind( this.skeleton.object );

    super.ngAfterViewInit();
  }
}
