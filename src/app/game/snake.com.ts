import { Component, AfterViewInit, HostListener, ViewChildren, QueryList, Input, forwardRef, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, SimpleChanges } from '@angular/core';
import { Subject, timer, Observable, never, of, merge, BehaviorSubject, combineLatest } from 'rxjs';
import { sampleTime, tap, startWith, filter, mergeMap, take, withLatestFrom } from 'rxjs/operators';
import { Vector3, Group, BoxBufferGeometry, Mesh, WireframeGeometry, LineSegments, Quaternion } from 'three';
import { MeshDir, deg90, vY, vX, vZero } from '../three-js';
import { AObject3D } from '../three-js/object-3d';
import { ACamera } from '../three-js/camera';
import { SnakeSegmentDir } from './snake/segment.dir';

interface IDir { [key: string]: [ Vector3, number, Vector3 ]; }
const dkd = 'document:keydown.',
dirs: IDir =
{
  up: [ vX, -deg90, new Vector3( 0, 1, -1 )  ],
  down: [ vX, deg90, new Vector3( 0, -1, -1 ) ],
  left: [ vY, deg90, new Vector3( 1, 0, -1 ) ],
  right: [ vY, -deg90, new Vector3( -1, 0, -1 ) ],
};

@Component
({
  selector: 'game-snake',
  templateUrl: './snake.com.pug',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: AObject3D, useExisting: forwardRef( () => SnakeCom ) }]
})
export class SnakeCom extends AObject3D<Group> implements AfterViewInit, OnChanges
{
  // @ViewChildren(MeshDir) cubes: QueryList<MeshDir>;
  @ViewChildren(SnakeSegmentDir) cubes: QueryList<SnakeSegmentDir>;

  // attached camera
  @Input() camera: ACamera<any>;

  // initial speed
  @Input() speed = 1000;
  // initial size
  @Input() size = 2;
  // initial length
  @Input() length = 3;

  @Input() position = vZero.clone();
  @Output() positionChange = new EventEmitter<Vector3>();
  segments: Array<Vector3>;
  @Input() behavior$: Observable<any> = never();
  @Output() behavior$Change = new EventEmitter<Observable<any>>();

  @Input() impulse$: Observable<{ time: number, delta: number}>;

  private _lookAtPosition = new Vector3;
  get lookAtPosition()
  {
    this._lookAtPosition.copy(this.cubes.first.object.children[0].position);
    this.cubes.first.object.children[0].localToWorld(this._lookAtPosition);
    return this._lookAtPosition;
  }

  ngAfterViewInit()
  {
    this.segments = Array( +this.length )
      .fill( undefined )
      .map( ( _, index ) => vZero.clone().sub( this.position.clone().add( new Vector3( 0, 0, +this.size * index ) ) ) );
    this._object = new Group;

    this.cubes.changes.subscribe( _ =>
    {
      this.object.add( ...this.cubes.map( ( { object } ) => object ) );
      if ( this.cubes.first )
      {
        this.positionChange.emit( this.cubes.first.object.position );
        // attach camera to head
        if ( this.camera ) this.cubes.first.object.children[0].add( this.camera.camera );
      }
    });

    // this.snake$ = this.direction$.pipe
    // (
    //   filter( dir => !!dir ),
    //   sampleTime( this.speed ),
    //   mergeMap( ( [ axis, angle ]: [ Vector3, number ] ) =>
    //   {
    //     const
    //       camera = this.camera.camera,
    //       headCube = this.cubes.first.object,
    //       cubesArray = this.cubes.toArray().map( ( { object } ) => object ),
    //       rotateCamera = this.camera
    //         ? timer( 0 ).pipe( tap( _ => camera.up.copy( vY ).applyQuaternion( headCube.quaternion ).normalize() ) )
    //         : of( undefined );
    //     return merge
    //     (
    //       timer( 0, this.speed ).pipe( take( this.length ), tap( idx => cubesArray[idx].rotateOnAxis( axis, angle ) ) ),
    //       rotateCamera
    //     );
    //   }),
    //   startWith( undefined )
    // );
    const direction$ = this.direction$.pipe
    (
      filter( dir => !!dir ),
      sampleTime( this.speed ),
      // withLatestFrom( this.impulse$ ),
      mergeMap( ( [ axis, angle, pivot ]: [ Vector3, number, Vector3 ] ) =>
      {
        const
          camera = this.camera.camera,
          headCube = this.cubes.first.object,
          cubesArray = this.cubes.toArray().map( ( { object } ) => object ),
          rotateCamera = this.camera
            ? timer( this.speed ).pipe( tap( _ => camera.up.copy( vY ).applyQuaternion( headCube.quaternion ).normalize() ) )
            : of( undefined );
        return merge
        (
          timer( 0, this.speed ).pipe
          (
            take( this.length ),
            tap( index =>
            {
              const currentCube = cubesArray[index];
              // if ( index === 0 )
              //   console.log( 'target:', currentCube.clone().rotateOnAxis( axis, angle ).quaternion );
              const p = pivot.clone();
              currentCube.children[0].position.sub( p );
              p.applyQuaternion( currentCube.quaternion ).multiplyScalar( this.size / 2 );
              cubesArray[index].position.add( p );
              const q = new Quaternion;
              q.setFromAxisAngle( axis, angle );
              const quaternion = currentCube.quaternion.clone().multiply( q );
              currentCube.userData.hasRotation = { axis, angle, quaternion };
            } )
          ),
          timer( this.speed - 1, this.speed ).pipe
          (
            take( this.length ),
            tap( index =>
            {
              const currentCube = cubesArray[index];
              const p = pivot.clone();
              p.applyQuaternion( currentCube.quaternion ).multiplyScalar( this.size / 2 );
              currentCube.position.sub( p ) ;
              currentCube.children[0].position.copy( vZero );
              currentCube.quaternion.copy( currentCube.userData.hasRotation.quaternion );
              currentCube.userData.hasRotation = undefined;
            })
          )
        );
      }),
      startWith( undefined )
    );

    this.behavior$ = this.impulse$.pipe
    (
      withLatestFrom( direction$, ),
      tap( ([ { time, delta } ]) => this.cubes.forEach( ({ object }, idx ) =>
      {
        const hasRotation = object.userData.hasRotation;
        if ( hasRotation )
        {
          object.rotateOnAxis( hasRotation.axis, delta / +this.speed * hasRotation.angle );
          if ( idx === 0 ) this.camera.camera.up.copy( vY ).applyQuaternion( object.quaternion ).normalize();
        }
        else
          object.translateZ( delta * this.size / this.speed );
      } ) ),
    );
    this.behavior$Change.emit( this.behavior$ );

    // setTimeout( () => { this.segments.push( new Vector3( 10, 10, 10 ) ); }, 1000 );
    super.ngAfterViewInit();

    setTimeout( () => this.direction$.next( dirs.left ), 100 );
  }

  ngOnChanges( changes: SimpleChanges )
  {
    
  }
  private direction$ = new Subject<any[]>();

  @HostListener(`${dkd}w`)
  @HostListener(`${dkd}arrowUp`)
  private arrowUp() { this.direction$.next( dirs.up ); }

  @HostListener(`${dkd}s`)
  @HostListener(`${dkd}arrowDown`)
  private arrowDown() { this.direction$.next( dirs.down ); }

  @HostListener(`${dkd}a`)
  @HostListener(`${dkd}arrowLeft`)
  private arrowLeft() { this.direction$.next( dirs.left ); }

  @HostListener(`${dkd}d`)
  @HostListener(`${dkd}arrowRight`)
  private arrowRight() { this.direction$.next( dirs.right ); }

}
