import { ChangeDetectionStrategy, Component, forwardRef, ViewChild, OnChanges, SimpleChange, Input, AfterViewInit } from '@angular/core';
import { BackSide, BoxBufferGeometry, BufferGeometry, EdgesGeometry, Float32BufferAttribute, LineBasicMaterial, LineSegments } from 'three';
import { AObject3D, LineSegmentsDir, BoxBufferGeometryDir, MeshLambertMaterialDir, AGeometry } from 'angular-three';

class GridBoxGeometry
{
  constructor( width: number, height: number, depth: number )
  {
    const halfWidth = width / 2;
    const halfHHeight = height / 2;

    const vertices = [
      -3, 0, -3.5,  3, 0, -3.5,
      -3, 0, -2.5,  3, 0, -2.5,
      -3, 0, -1.5,  3, 0, -1.5,
      -3, 0, -.5,   3, 0,  -.5,
      -3, 0,  .5,   3, 0,   .5,
      -3, 0,  1.5,  3, 0,  1.5,
      -3, 0,  2.5,  3, 0,  2.5,
      -3, 0,  3.5,  3, 0,  3.5,
      -2, 0, -4.5, -2, 0,  4.5,
      -1, 0, -4.5, -1, 0,  4.5,
       0, 0, -4.5,  0, 0,  4.5,
       1, 0, -4.5,  1, 0,  4.5,
       2, 0, -4.5,  2, 0,  4.5,
    ];
    const geometry = new BufferGeometry();
    geometry.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
    // geometry.setAttribute( 'color', new Float32BufferAttribute( colors, 3 ) );
    return geometry;
  }
}
@Component
( {
  selector: 'game-box',
  template: `
    <three-box-buffer-geometry
      [width]='width' [height]='height' [depth]='depth'
      [widthSegments]="2" [heightSegments]="2" [depthSegments]="2">
    </three-box-buffer-geometry>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ { provide: AObject3D, useExisting: forwardRef( () => BoxCom ) } ]
} )
export class BoxCom extends LineSegmentsDir implements OnChanges, AfterViewInit
{
  @Input() width = 49;
  @Input() height = 49;
  @Input() depth = 49;
  BackSide = BackSide;
  @ViewChild( BoxBufferGeometryDir, { static: false } ) geometry: AGeometry<any>;
  ngAfterViewInit()
  {
    this.geometry.object = new GridBoxGeometry( this.width, this.height, this.depth );
    this.material = { object: new LineBasicMaterial( { color: 0x000, toneMapped: false } ) } as any;
    super.ngAfterViewInit();
  }
  ngOnChanges( { position }: { position: SimpleChange } )
  {
    try { this.object.position.copy( position.currentValue ); } catch ( e ) {}
  }
}
