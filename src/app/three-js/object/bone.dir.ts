import { Directive, AfterViewInit, forwardRef, ContentChild } from '@angular/core';
import * as THREE from 'three';
import { AObject3D } from '../object-3d';

@Directive
({
  selector: 'three-bone',
  providers: [{ provide: AObject3D, useExisting: forwardRef(() => BoneDir) }]
})
export class BoneDir extends AObject3D<THREE.Bone> implements AfterViewInit
{
  ngAfterViewInit()
  {
    this._object = new THREE.Bone();
    super.ngAfterViewInit();
  }
}
