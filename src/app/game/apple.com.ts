import { ChangeDetectionStrategy, Component, forwardRef, ViewChild, OnChanges, SimpleChange } from '@angular/core';
import { AObject3D, SphereBufferGeometryDir, MeshDir, MeshPhongMaterialDir } from '../three-js';

@Component
({
  selector: 'game-apple',
  template: `
    <three-sphere-buffer-geometry radius='.75'></three-sphere-buffer-geometry>
    <three-mesh-phong-material></three-mesh-phong-material>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: AObject3D, useExisting: forwardRef( () => AppleCom ) }]
})
export class AppleCom extends MeshDir implements OnChanges
{
  @ViewChild( SphereBufferGeometryDir, { static: false } ) geometry: SphereBufferGeometryDir;
  @ViewChild( MeshPhongMaterialDir, { static: false } ) material: MeshPhongMaterialDir;

  ngOnChanges( { position }: { position: SimpleChange } )
  {
    try { this.object.position.copy( position.currentValue ); } catch ( e ) {}
  }
}
