import { forwardRef, AfterViewInit, Directive, Input } from '@angular/core';
import { AObject3D, vZero } from '../../three-js';
import { LineSegments, BoxBufferGeometry, Mesh, MeshPhongMaterial, WireframeGeometry, Vector3, ExtrudeBufferGeometry, Shape } from 'three';
import { Observable } from 'rxjs';
import { scan } from 'rxjs/operators';

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
  private boxMesh: Mesh;
  @Input() loop$: Observable<any>;

  ngAfterViewInit()
  {
    this.boxMesh = new Mesh( createBoxWithRoundedEdges( 2, 2, 2, .2, 16 ), new MeshPhongMaterial( { color: 0x2194CE } ) );
    this.boxMesh.scale.copy( new Vector3( .75, .75, .75) );
    const wireBoxGeom = new BoxBufferGeometry( 2, 2, 2 );
    const wireGeom = new WireframeGeometry( wireBoxGeom );
    const lines = new LineSegments( wireGeom );
    Object.assign( lines.material, { depthTest: false, opacity: .1, transparent: true, needsUpdate: true } );
    // boxMesh.position.set( 0, .5, .5 );
    // line.position.set( 0, 0, 0 );
    this.boxMesh.position.setZ( -2 );
    this.boxMesh.name = 'segment';
    lines.add( this.boxMesh );
    lines.position.copy( this.position );

    const wireBoxGeom1 = new BoxBufferGeometry( 2, 2, 2 );
    const wireGeom1 = new WireframeGeometry( wireBoxGeom1 );
    const lines1 = new LineSegments( wireGeom1 );
    Object.assign( lines.material, { depthTest: false, opacity: .5, transparent: true } );

    lines1.add( lines );

    this._object = lines;

    this.loop$.pipe(
      scan<any, any>( (previous, current) =>
      {
        if ( current.futureTime !== previous.futureTime )
        {
          this.boxMesh.position.setZ( -2 );
        }
        this.boxMesh.translateZ( current.delta * 2 / 3000 );
        return current;
      }, { futureTime: null } ) )
      .subscribe();

    super.ngAfterViewInit();
  }
}
