import { forwardRef, AfterViewInit, Directive, Input, Output, EventEmitter } from '@angular/core';
import { AObject3D, vZero, deg90, vX, vY, vZ, quatZero } from '../../three-js';
import { LineSegments, BoxBufferGeometry, Mesh, MeshPhongMaterial, WireframeGeometry, Vector3, ExtrudeBufferGeometry, Shape, Object3D, Color, Quaternion, ArrowHelper } from 'three';
import { Observable, of } from 'rxjs';
import { scan, withLatestFrom, startWith, switchAll, combineLatest, switchMap, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export enum DirectionCommand { UP = 1, DOWN = 2 , LEFT = 3, RIGHT = 4 }
/**
 * axis, angle, innerBox pivot, cube position
 */
type DirectionSpec = [ Vector3, number, Vector3, Vector3 ];
export class DirectionSpecs
{
  static readonly [DirectionCommand.UP]: DirectionSpec = [ vX, -deg90, new Vector3( 0, 1, -1 ), new Vector3( 0, -1, -1 ) ];
  static readonly [DirectionCommand.DOWN]: DirectionSpec = [ vX, deg90, new Vector3( 0, -1, -1 ), new Vector3( 0, 1, -1 ) ];
  static readonly [DirectionCommand.LEFT]: DirectionSpec = [ vY, deg90, new Vector3( 1, 0, -1 ), new Vector3( -1, 0, -1 ) ];
  static readonly [DirectionCommand.RIGHT]: DirectionSpec = [ vY, -deg90, new Vector3( -1, 0, -1 ), new Vector3( 1, 0, -1 ) ];
}

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
  @Input() speed = 3000;
  @Input() loop$: Observable<any>;
  @Input() direction$: Observable<any>;
  @Input() renderer: any;
  @Input() dev = false;
  @Output() rotation$ = new EventEmitter<Quaternion>();

  private _lookAtPosition = new Vector3;
  @Output() get lookAt()
  {
    this.cube.getWorldPosition( this._lookAtPosition );
    return this._lookAtPosition;
  }

  private setupHelpers()
  {
    if ( this.dev || !environment.production )
    {
      const wireBoxGeom = new BoxBufferGeometry( this.size, this.size, this.size );
      const wireGeom = new WireframeGeometry( wireBoxGeom );
      this.innerBox = new LineSegments( wireGeom );
      this.innerBox.scale.copy( new Vector3( .9375, .9375, .9375 ) );
      Object.assign( (this.innerBox as LineSegments).material,
      {
        depthTest: false,
        color: new Color(0xAA33FF),
        opacity: .5,
        transparent: true
      } );
      const wireBoxGeom1 = new BoxBufferGeometry( this.size, this.size, this.size );
      const wireGeom1 = new WireframeGeometry( wireBoxGeom1 );
      this.outerBox = new LineSegments( wireGeom1 );
      Object.assign( (this.outerBox as LineSegments).material,
      {
        depthTest: false,
        color: new Color(0xAA9900),
        opacity: .25,
        transparent: true
      } );

      const arrowOrigin = vZ.clone().multiplyScalar( this.size / 2 );
      this.outerBox.add( new ArrowHelper( vZ, arrowOrigin, this.size * .5, 0x66AA00 ) );
      this.innerBox.add( new ArrowHelper( vZ, arrowOrigin, this.size * .5, 0xAA6600 ) );
      this.cube.add( new ArrowHelper( vZ, arrowOrigin, this.size * .5, 0x66AA00 ) );
      return;
    }
    this.innerBox = new Object3D;
    this.outerBox = new Object3D;
  }
  subLoop$: any;
  cube: Mesh;
  private innerBox: Object3D;
  private outerBox: Object3D;
  ngAfterViewInit()
  {
    this.cube = new Mesh
    (
      createBoxWithRoundedEdges( this.size, this.size, this.size, this.size / 10, 16 ),
      new MeshPhongMaterial( { color: 0x2194CE } )
    );
    this.cube.scale.copy( new Vector3( .75, .75, .75 ) );
    this.cube.position.setZ( -this.size );
    this.setupHelpers();
    this.innerBox.add( this.cube );
    this.outerBox.add( this.innerBox );
    this._object = this.outerBox;

    this.subLoop$ = this.loop$.pipe
    (
      combineLatest
      (
        this.direction$.pipe
        (
          startWith( undefined ),
          switchMap( current => of( current, undefined ) ),
          tap( _ => console.log( 'dir:', _ ) )
        )
      ),
      scan<any, any>
      ((
        [ { futureTime: prevFutureTime }, startDirection, endDirection ],
        [ { futureTime, delta }, currentDirection ]
      ) =>
      {
        // key frame
        if ( futureTime !== prevFutureTime )
        {
          if ( endDirection ) // end rotation
          {
            this.outerBox.position.round();
            this.innerBox.quaternion.copy( quatZero );
            this.innerBox.position.copy( vZero );
            this.cube.quaternion.copy( quatZero );
            this.cube.position.copy( vZero ).setZ( -this.size );
            endDirection = undefined;
          }
          if ( !startDirection ) this.cube.position.setZ( -this.size );
          if ( startDirection ) // begin rotation
          {
            const [ axis, angle, pivot, cubePos ] = DirectionSpecs[startDirection];
            this.outerBox.quaternion.multiply( quatZero.clone().setFromAxisAngle( axis, angle ) );
            this.innerBox.position.add( pivot.clone().multiplyScalar( this.size / 2 ) );
            this.cube.position.copy( vZero ).add( cubePos.clone().multiplyScalar( this.size / 2 ) );
            this.cube.quaternion.copy( quatZero.clone().setFromAxisAngle( axis, -angle ) );
            endDirection = [ axis, angle ];
            // TODO: lerp with cube?
            this.rotation$.emit( this.outerBox.quaternion );
            startDirection = undefined;
          }
          this.outerBox.translateZ( this.size );
          this.outerBox.updateMatrixWorld(true);
          this.innerBox.updateMatrixWorld(true);
          this.cube.updateMatrixWorld(true);
        }
        // continuos loop
        if ( !!endDirection )
        {
          const [ axis, angle ] = endDirection;
          this.innerBox.rotateOnAxis( axis, delta / this.speed * angle );
        }
        else this.cube.translateZ( delta * 2 / this.speed );
        return [ { futureTime, delta }, currentDirection || startDirection, endDirection ];
      }, [{ futureTime: null }] )
    )
    .subscribe();

    super.ngAfterViewInit();
  }
}
