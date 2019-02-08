import { forwardRef, AfterViewInit, Directive, Input } from '@angular/core';
import { AObject3D, vZero, RoundedBoxBufferGeometry } from '../../three-js';
import { LineSegments, BoxBufferGeometry, Mesh, MeshPhongMaterial, WireframeGeometry, Vector3 } from 'three';

@Directive
({
  selector: 'game-snake-segment',
  providers: [{ provide: AObject3D, useExisting: forwardRef( () => SnakeSegmentDir ) }]
})
export class SnakeSegmentDir extends AObject3D<LineSegments> implements AfterViewInit
{
  @Input() position = vZero.clone();
  ngAfterViewInit()
  {
    let boxGeom = new RoundedBoxBufferGeometry( 2, 2, 2, 4, 4 );
    boxGeom = boxGeom.toNonIndexed() as BoxBufferGeometry;
    const boxMesh = new Mesh( boxGeom, new MeshPhongMaterial( { color: 0x2194CE } ) );
    boxMesh.scale.copy( new Vector3( .75, .75, .75) );
    const wireBoxGeom = new BoxBufferGeometry( 2, 2, 2 );
    const wireGeom = new WireframeGeometry( wireBoxGeom );
    const lines = new LineSegments( wireGeom );
    Object.assign( lines.material, { depthTest: false, opacity: .5, transparent: true } );
    // boxMesh.position.set( 0, .5, .5 );
    // line.position.set( 0, 0, 0 );
    lines.add( boxMesh );
    lines.position.copy( this.position );
    this._object = lines;
    super.ngAfterViewInit();
  }
}
