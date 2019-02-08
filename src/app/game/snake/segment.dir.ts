import { forwardRef, AfterViewInit, Directive, Input } from '@angular/core';
import { AObject3D, vZero } from '../../three-js';
import { LineSegments, BoxBufferGeometry, Mesh, MeshPhongMaterial, WireframeGeometry, Vector3, ExtrudeBufferGeometry, Shape } from 'three';


function createBoxWithRoundedEdges( width, height, depth, radius0, smoothness )
{
  const shape = new Shape();
  const eps = 0.00001;
  const radius = radius0 - eps;
  shape.absarc( eps, eps, eps, -Math.PI / 2, -Math.PI, true );
  shape.absarc( eps, height -  radius * 2, eps, Math.PI, Math.PI / 2, true );
  shape.absarc( width - radius * 2, height -  radius * 2, eps, Math.PI / 2, 0, true );
  shape.absarc( width - radius * 2, eps, eps, 0, -Math.PI / 2, true );
  const geometry = new ExtrudeBufferGeometry( shape,
  {
    depth: depth - radius0 * 2,
    bevelEnabled: true,
    bevelSegments: smoothness * 2,
    steps: 1,
    bevelSize: radius,
    bevelThickness: radius0,
    curveSegments: smoothness
  });

  geometry.center();

  return geometry.toNonIndexed();
}

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
    const boxMesh = new Mesh( createBoxWithRoundedEdges( 2, 2, 2, .2, 16 ), new MeshPhongMaterial( { color: 0x2194CE } ) );
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
