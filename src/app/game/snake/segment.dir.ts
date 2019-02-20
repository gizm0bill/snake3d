import { forwardRef, AfterViewInit, Directive, Input, Output } from '@angular/core';
import { AObject3D, vZero } from '../../three-js';
import { LineSegments, BoxBufferGeometry, Mesh, MeshPhongMaterial, WireframeGeometry, Vector3, ExtrudeBufferGeometry, Shape, Object3D, Color } from 'three';
import { Observable, of } from 'rxjs';
import { scan, withLatestFrom, startWith, switchAll } from 'rxjs/operators';

function createBoxWithRoundedEdges( width: number, height: number, depth: number, radius0: number, smoothness: number )
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
export class SnakeSegmentDir extends AObject3D<Object3D> implements AfterViewInit
{
  @Input() size = 1;
  @Input() position = vZero.clone();
  @Input() loop$: Observable<any>;
  @Input() direction$: Observable<any>;

  private _lookAtPosition = new Vector3;
  @Output() get lookAt()
  {
    this.cube.getWorldPosition( this._lookAtPosition );
    return this._lookAtPosition;
  }

  private cube: Mesh;
  private innerBox: LineSegments;
  private outerBox: LineSegments;
  // private innerBox: Object3D;
  // private outerBox: Object3D;
  ngAfterViewInit()
  {
    this.cube = new Mesh
    (
      createBoxWithRoundedEdges( this.size, this.size, this.size, this.size / 10, 16 ),
      new MeshPhongMaterial( { color: 0x2194CE } )
    );
    this.cube.scale.copy( new Vector3( .75, .75, .75) );
    this.cube.position.setZ( -this.size );

    const wireBoxGeom = new BoxBufferGeometry( this.size, this.size, this.size );
    const wireGeom = new WireframeGeometry( wireBoxGeom );
    this.innerBox = new LineSegments( wireGeom );
    Object.assign( this.innerBox.material, { depthTest: false, color: new Color(0xAA33FF), opacity: .5, transparent: true } );
    this.innerBox.add( this.cube );

    const wireBoxGeom1 = new BoxBufferGeometry( this.size, this.size, this.size );
    const wireGeom1 = new WireframeGeometry( wireBoxGeom1 );
    this.outerBox = new LineSegments( wireGeom1 );
    Object.assign( this.outerBox.material, { depthTest: false, color: new Color(0xAA9900), opacity: .25, transparent: true } );
    this.outerBox.add( this.innerBox );

    this._object = this.outerBox;

    this.direction$.pipe
    (
      scan( (prev, current) =>
      {
        return of( current, undefined );
      }, undefined ),
      switchAll()
    ).subscribe( _ => { debugger; } );

    this.loop$.pipe
    (
      scan<any, any>( ( previousTime , currentTime ) =>
      {
        // debugger;
        if ( currentTime.futureTime !== previousTime.futureTime )
        {
          this.cube.position.setZ( -2 );
          this.outerBox.updateMatrixWorld(true);
          this.innerBox.updateMatrixWorld(true);
        }
        this.cube.translateZ( currentTime.delta * 2 / 3000 );
        return currentTime;
      }, [{ futureTime: null }] )
    )
    .subscribe();

    super.ngAfterViewInit();
  }
}
