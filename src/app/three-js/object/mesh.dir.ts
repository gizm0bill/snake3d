import { Directive, AfterViewInit, forwardRef, ContentChild } from '@angular/core';
import * as THREE from 'three';
import { AObject3D } from '../object-3d';
import { AMaterial } from '../material';
import { AGeometry } from '../geometry';

@Directive
({
  selector: 'three-mesh',
  providers: [{ provide: AObject3D, useExisting: forwardRef(() => MeshDir) }]
})
export class MeshDir extends AObject3D<THREE.Mesh> implements AfterViewInit
{
  @ContentChild(AGeometry) geometry: AGeometry<any>;
  @ContentChild(AMaterial) material: AMaterial<any>;

  ngAfterViewInit()
  {
    this._object = new THREE.Mesh
    (
      this.geometry.object,
      this.material && this.material.object || new THREE.MeshBasicMaterial({ color: 0xff00ff })
    );
    super.ngAfterViewInit();
  }
}
