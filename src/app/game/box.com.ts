import { ChangeDetectionStrategy, Component, forwardRef, ViewChild, OnChanges, SimpleChange } from '@angular/core';
import { BackSide } from 'three';
import { AObject3D, MeshDir, MeshPhongMaterialDir, BoxBufferGeometryDir } from '../three-js';
import { MeshStandardMaterialDir } from '../three-js/material/mesh/standard.dir';

@Component
({
  selector: 'game-box',
  template: `
    <three-box-buffer-geometry></three-box-buffer-geometry>
    <three-mesh-standard-material [side]='BackSide'></three-mesh-standard-material>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: AObject3D, useExisting: forwardRef( () => BoxCom ) }]
})
export class BoxCom extends MeshDir implements OnChanges
{
  BackSide = BackSide;
  @ViewChild( BoxBufferGeometryDir, { static: false } ) geometry: BoxBufferGeometryDir;
  @ViewChild( MeshPhongMaterialDir, { static: false } ) material: MeshStandardMaterialDir;

  ngOnChanges( { position }: { position: SimpleChange } )
  {
    try { this.object.position.copy( position.currentValue ); } catch ( e ) {}
  }
}
