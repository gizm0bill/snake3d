import { Component, AfterViewInit, HostListener, ViewChildren, QueryList, Input, forwardRef, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, SimpleChanges } from '@angular/core';
import { Subject, timer, Observable, never, of, merge, BehaviorSubject, combineLatest } from 'rxjs';
import { sampleTime, tap, startWith, filter, mergeMap, take, withLatestFrom, scan, share, delay } from 'rxjs/operators';
import { Vector3, Group, BoxBufferGeometry, Mesh, WireframeGeometry, LineSegments, Quaternion } from 'three';
import { MeshDir, deg90, vY, vX, vZero, deg85 } from '../three-js';
import { AObject3D } from '../three-js/object-3d';
import { ACamera } from '../three-js/camera';
import { SnakeSegmentDir } from './snake/segment.dir';

interface IDir { [key: string]: [ Vector3, number, Vector3 ]; }
const dkd = 'document:keydown.',
dirs: IDir =
{
  up: [ vX, -deg90, new Vector3( 0, 1, -1 )  ],
  down: [ vX, deg90, new Vector3( 0, -1, -1 ) ],
  left: [ vY, deg85, new Vector3( 1, 0, -1 ) ],
  right: [ vY, -deg90, new Vector3( -1, 0, -1 ) ],
};

@Component
({
  selector: 'game-snake-1',
  templateUrl: './snake.com.pug',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: AObject3D, useExisting: forwardRef( () => Snake1Com ) }]
})
export class Snake1Com extends AObject3D<Group> implements AfterViewInit, OnChanges
{
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
  @Output() loop$Change = new EventEmitter<Observable<any>>();

  @Input() renderer: any;

  get lookAtPosition(){ return this.cubes.first.lookAt; }

  subLoop$: Observable<any>;
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
        if ( this.camera ) this.cubes.first.object.children[0].children[0].add( this.camera.camera );
      }
    });

    this.loop$Change.emit( this.loop$ );

    this.subLoop$ = this.loop$.pipe
    (
      scan<any, any>( (previous, current) =>
      {
        current.futureTime = previous.futureTime;
        if ( current.time > previous.futureTime  )
        {
          // this.cubes.forEach( cube => cube.object.translateZ( this.size ) );
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

    // setTimeout( () => { this.segments.push( new Vector3( 10, 10, 10 ) ); }, 1000 );
    super.ngAfterViewInit();

    setTimeout( () => this.direction$.next( dirs.left ), 1000 );
  }

  ngOnChanges( changes: SimpleChanges )
  {

  }
  direction$ = new Subject<any[]>();

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
