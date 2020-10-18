import { ChangeDetectionStrategy, Component, forwardRef, ViewChild, OnChanges, SimpleChange, Input } from '@angular/core';
import { DoubleSide } from 'three';
import { AObject3D, MeshDir, BoxBufferGeometryDir, MeshLambertMaterialDir } from 'angular-three';

@Component
({
  selector: 'game-box',
  template: `
    <three-box-buffer-geometry [width]='width' [height]='height' [depth]='depth'></three-box-buffer-geometry>
    <three-lambert-material [side]='DoubleSide' color="yellow" transparent="1" [opacity]=".1"></three-lambert-material>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: AObject3D, useExisting: forwardRef( () => BoxCom ) }]
})
export class BoxCom extends MeshDir implements OnChanges
{
  @Input() width = 49;
  @Input() height = 49;
  @Input() depth = 49;
  DoubleSide = DoubleSide;
  @ViewChild( BoxBufferGeometryDir, { static: false } ) geometry: BoxBufferGeometryDir;
  @ViewChild( MeshLambertMaterialDir, { static: false } ) material: MeshLambertMaterialDir;
  ngOnChanges( { position }: { position: SimpleChange } )
  {
    try { this.object.position.copy( position.currentValue ); } catch ( e ) {}
  }
}
