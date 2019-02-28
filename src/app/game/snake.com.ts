import { Component, AfterViewInit, HostListener, ViewChildren, QueryList, Input,
  forwardRef, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { Subject, Observable, never } from 'rxjs';
import { scan, share, delay, } from 'rxjs/operators';
import { Vector3, Group } from 'three';
import { vZero, vY } from '../three-js';
import { AObject3D } from '../three-js/object-3d';
import { ACamera } from '../three-js/camera';
import { SnakeSegmentDir, DirectionCommand } from './snake/segment.dir';

const dkd = 'document:keydown.';
@Component
({
  selector: 'game-snake',
  templateUrl: './snake.com.pug',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: AObject3D, useExisting: forwardRef( () => SnakeCom ) }]
})
export class SnakeCom extends AObject3D<Group> implements AfterViewInit, OnChanges
{
  void() {}
  log( ...args: any[] ) { console.log(...args); }
  // @ViewChildren(MeshDir) cubes: QueryList<MeshDir>;
  @ViewChildren(SnakeSegmentDir) cubes: QueryList<SnakeSegmentDir>;

  // attached camera
  @Input() camera: ACamera<any>;

  // initial speed
  @Input() speed = 1000;
  // initial size
  @Input() size = 1;
  // initial length
  @Input() length = 3;

  @Input() position = vZero.clone();
  @Output() positionChange = new EventEmitter<Vector3>();
  segments: Array<Vector3>;
  @Input() behavior$: Observable<any> = never();
  @Output() behavior$Change = new EventEmitter<Observable<any>>();

  @Input() loop$: Observable<{ time: number, delta: number}>;

  @Input() renderer: any;

  get lookAtPosition(){ return  this.cubes.first ? this.cubes.first.lookAt : vZero; }

  constructor( private cdr: ChangeDetectorRef ) { super(); }
  subLoop$: Observable<any>;
  ngAfterViewInit()
  {
    this.subLoop$ = this.loop$.pipe
    (
      scan<any, any>( (previous, current) =>
      {
        current.futureTime = previous.futureTime;
        if ( current.time > previous.futureTime  )
        {
          const dt = current.time - current.futureTime;
          if ( dt > this.speed )
          {
            current.delta = 16.66;
            current.futureTime = current.time + current.delta;
          }
          else
          {
            current.delta = current.time - current.futureTime;
            current.futureTime += this.speed - dt;
          }
        }
        return current;
      }, { futureTime: performance.now() } ),
      share(),
    );
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
        if ( this.camera ) this.cubes.first.cube.add( this.camera.camera );
      }
    });
    super.ngAfterViewInit();
    this.cdr.detectChanges();

    // setTimeout( () => this.direction$.next( DirectionCommand.LEFT ), 1500 );
    // setTimeout( () => this.direction$.next( DirectionCommand.UP ), 3000 );
    // setTimeout( () => this.direction$.next( DirectionCommand.RIGHT ), 4500 );
    // setTimeout( () => this.direction$.next( DirectionCommand.DOWN ), 6000 );
  }

  directionForSegment( index: number ) { return this.direction$.pipe( delay( index * this.speed ) ); } // * .995?

  ngOnChanges( changes: SimpleChanges )
  {

  }

  updateCamera( quaternion ) {
    this.camera.camera.up.copy( vY ).applyQuaternion( quaternion ).normalize();
  }

  direction$ = new Subject<DirectionCommand>();

  @HostListener(`${dkd}w`)
  @HostListener(`${dkd}arrowUp`)
  private arrowUp() { this.direction$.next( DirectionCommand.UP ); }

  @HostListener(`${dkd}s`)
  @HostListener(`${dkd}arrowDown`)
  private arrowDown() { this.direction$.next( DirectionCommand.DOWN ); }

  @HostListener(`${dkd}a`)
  @HostListener(`${dkd}arrowLeft`)
  private arrowLeft() { this.direction$.next( DirectionCommand.LEFT ); }

  @HostListener(`${dkd}d`)
  @HostListener(`${dkd}arrowRight`)
  private arrowRight() { this.direction$.next( DirectionCommand.RIGHT ); }

}
