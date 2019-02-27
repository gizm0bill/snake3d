import { forwardRef, AfterViewInit, Directive, Input, Output } from '@angular/core';
import { AObject3D, vZero } from '../../three-js';
import { LineSegments, BoxBufferGeometry, Mesh, MeshPhongMaterial, WireframeGeometry, Vector3, ExtrudeBufferGeometry, Shape, Object3D, Color, Quaternion } from 'three';
import { Observable, of } from 'rxjs';
import { scan, withLatestFrom, startWith, switchAll, combineLatest, switchMap, tap } from 'rxjs/operators';

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
  @Input() renderer: any;

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

    this.loop$.pipe
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
        [ { futureTime: prevFutureTime }, previousDirection, endDirection ],
        [ { futureTime, delta }, currentDirection ]
      ) =>
      {
        if ( futureTime !== prevFutureTime )
        {
          console.log( previousDirection, endDirection );
          if ( previousDirection ) // begin rotation
          {
            const [ axis, angle, pivot ] = previousDirection;
            this.outerBox.quaternion.copy( (new Quaternion).setFromAxisAngle( axis, angle ) );
            const p = pivot.clone(); // pivot
            this.innerBox.position.add( p.multiplyScalar( this.size / 2 ) );
            this.cube.position.add( new Vector3( -1, 0, -1 ) );
            // this.cube.position.sub( p );
            // this.cube.position.setZ( -this.size / 2 );
            // this.renderer.render();
            // debugger;
            // p.applyQuaternion( this.innerBox.quaternion ).multiplyScalar( this.size / 2 );
            // this.innerBox.position.add( p );
            // this.renderer.render();
            // debugger;
            // const quaternion = this.innerBox.quaternion.clone().multiply( (new Quaternion).setFromAxisAngle( axis, angle ) );
            // this.outerBox.quaternion.copy( quaternion );
            // this.outerBox.translateZ( this.size );
            endDirection = [ axis, angle, /*quaternion*/ ];
            previousDirection = undefined;
          }
          else if ( endDirection ) // end rotation
          {
            this.innerBox.quaternion.copy( new Quaternion );
            this.innerBox.position.copy( vZero );
            this.cube.position.copy( vZero ).setZ( -this.size );
            endDirection = undefined;
          }
          else
          {
            this.cube.position.setZ( -this.size );
          }
          this.outerBox.updateMatrixWorld(true);
          this.innerBox.updateMatrixWorld(true);

          this.outerBox.translateZ( this.size );
          this.renderer.render();

        }
        if ( endDirection )
        {
          const [ axis, angle ] = endDirection;
          this.innerBox.rotateOnAxis( axis, delta / 5000 * angle );
          // if ( idx === 0 ) this.camera.camera.up.copy( vY ).applyQuaternion( object.quaternion ).normalize();
        }
        else this.cube.translateZ( delta * 2 / 5000 );

        return [ { futureTime, delta }, currentDirection || previousDirection, endDirection ];
      }, [{ futureTime: null }] )
    )
    .subscribe();

    super.ngAfterViewInit();
  }
}
