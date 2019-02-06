import { Component, AfterViewInit, HostListener, ViewChildren, QueryList, Input, forwardRef, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, SimpleChanges } from '@angular/core';
import { Subject, timer, Observable, never, of, merge } from 'rxjs';
import { sampleTime, tap, startWith, filter, mergeMap, take } from 'rxjs/operators';
import { Vector3, Group } from 'three';
import { MeshDir, deg90, vY, vX, vZero } from '../three-js';
import { AObject3D } from '../three-js/object-3d';
import { ACamera } from '../three-js/camera';

const dkd = 'document:keydown.';
const dirs =
{
  up: [ vX, -deg90 ],
  down: [ vX, deg90 ],
  left: [ vY, deg90 ],
  right: [ vY, -deg90 ],
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
  @ViewChildren(MeshDir) cubes: QueryList<MeshDir>;

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
  @Input() snake$: Observable<any> = never();
  @Output() snake$Change = new EventEmitter<Observable<any>>();

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
        if ( this.camera ) this.cubes.first.object.add( this.camera.camera );
      }
    });

    this.snake$ = this.direction$.pipe
    (
      filter( dir => !!dir ),
      sampleTime( this.speed ),
      mergeMap( ( [ axis, angle ]: [ Vector3, number ] ) =>
      {
        const
          camera = this.camera.camera,
          headCube = this.cubes.first.object,
          cubesArray = this.cubes.toArray().map( ( { object } ) => object ),
          rotateCamera = this.camera
            ? timer( 0 ).pipe( tap( _ => camera.up.copy( vY ).applyQuaternion( headCube.quaternion ).normalize() ) )
            : of( undefined );
        return merge
        (
          timer( 0, this.speed ).pipe( take( this.length ), tap( idx => cubesArray[idx].rotateOnAxis( axis, angle ) ) ),
          rotateCamera
        );
      }),
      startWith( undefined )
    );
    this.snake$Change.emit( this.snake$ );

    // setTimeout( () => { this.segments.push( new Vector3( 10, 10, 10 ) ); }, 1000 );
    super.ngAfterViewInit();
  }

  ngOnChanges( changes: SimpleChanges )
  {
    
  }
  private direction$ = new Subject;

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
