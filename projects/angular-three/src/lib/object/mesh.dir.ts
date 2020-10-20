import { Directive, AfterViewInit, forwardRef, ContentChild } from '@angular/core';
import { Mesh, MeshBasicMaterial } from 'three';
import { AObject3D } from '../object-3d';
import { AMaterial } from '../material';
import { AGeometry } from '../geometry';

@Directive
({
  selector: 'three-mesh',
  providers: [ { provide: AObject3D, useExisting: forwardRef(() => MeshDir) } ]
})
export class MeshDir extends AObject3D<Mesh> implements AfterViewInit
{
  @ContentChild( AGeometry, { static: true } ) geometry: AGeometry<any>;
  @ContentChild( AMaterial, { static: true } ) material: AMaterial<any>;
  ngAfterViewInit()
  {
    this._object = new Mesh
    (
      this.geometry.object,
      this.material && this.material.object || new MeshBasicMaterial({ color: 0xff00ff })
    );
    super.ngAfterViewInit();
  }
}
