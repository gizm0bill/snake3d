import { ChangeDetectionStrategy, Component, forwardRef, ViewChild, OnChanges, SimpleChange, Input } from '@angular/core';
import { AObject3D, SphereBufferGeometryDir, MeshDir, MeshLambertMaterialDir } from 'angular-three';

@Component
({
  selector: 'game-apple',
  template: `
    <three-sphere-buffer-geometry [radius]='size / 2'></three-sphere-buffer-geometry>
    <three-lambert-material></three-lambert-material>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: AObject3D, useExisting: forwardRef( () => AppleCom ) }]
})
export class AppleCom extends MeshDir implements OnChanges
{
  @Input() size = 1;
  @ViewChild( SphereBufferGeometryDir, { static: false } ) geometry: SphereBufferGeometryDir;
  @ViewChild( MeshLambertMaterialDir, { static: false } ) material: MeshLambertMaterialDir;

  ngOnChanges( { position }: { position: SimpleChange } )
  {
    try { this.object.position.copy( position.currentValue ); } catch ( e ) {}
  }
}
