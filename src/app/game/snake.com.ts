import { Component, AfterViewInit, HostListener, ViewChildren, QueryList, Input,
  forwardRef, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, SimpleChanges, ChangeDetectorRef, IterableDiffers, IterableDiffer, IterableChangeRecord } from '@angular/core';
import { Subject, Observable, never, interval, of, defer, animationFrameScheduler, timer, zip, merge, empty } from 'rxjs';
import { scan, share, startWith, switchMap, combineLatest, map, take, throttleTime, tap, filter, } from 'rxjs/operators';
import { Vector3, Group, Quaternion } from 'three';
import { vZero, vY, vZ } from '../three-js';
import { AObject3D } from '../three-js/object-3d';
import { ACamera } from '../three-js/camera';
import { SnakeSegmentDir, DirectionCommand } from './snake/segment.dir';
import { AnonymousSubject } from 'rxjs/internal/Subject';

const dirs = {};
let currentExhausts;
const snakeDelay = ( keyFrames: number, tag?: string ) => (source: AnonymousSubject<any>) => defer( () =>
{
  const dirExhausts = {};
  if ( currentExhausts )
    for ( const i in currentExhausts ) if ( currentExhausts.hasOwnProperty(i) )
      dirExhausts[i] = currentExhausts[i] + 1;
  currentExhausts = dirExhausts;
  return source.pipe
  (
    scan<any, any>
    ((
      [ { futureTime: prevFutureTime } ],
      [ { futureTime, delta, time }, currentDirection ]
    ) =>
    {
      if ( !!currentDirection )
      {
        dirs[ futureTime ] = currentDirection;
        // dirs.push( currentDirection );
        dirExhausts[ futureTime ] = keyFrames;
      }
      let retDirection: DirectionCommand;
      if ( prevFutureTime !== futureTime )
      {
        // dirExhausts = dirExhausts.reduceRight( (acc, val) => ( --val >= 0 ? [val] : ( retDirection = dirs.shift(), [] ) ).concat(acc), [] );
        for ( const i in dirs ) if ( dirs.hasOwnProperty(i) ) {
          if ( !dirExhausts[i] ) dirExhausts[i] = 0;
          dirExhausts[i]--;
          if ( dirExhausts[i] === -1 ) retDirection = dirs[i];
        }
      }
      return [ { futureTime, delta, time }, retDirection, tag ];
    } )
  );
});

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
  @Output() positionChange = new EventEmitter<Vector3[]>();
  segments: Array<Vector3>;
  @Input() behavior$: Observable<any> = never();
  @Output() behavior$Change = new EventEmitter<Observable<any>>();

  @Input() loop$: Observable<{ time: number, delta: number}>;
  @Output() loop$Change = new EventEmitter<Observable<any>>();

  @Input() subLoop$: Observable<any>;

  @Input() position$: Observable<any>;
  @Output() position$Change = new EventEmitter<Observable<any>>();

  @Input() apple$: Observable<any>;

  @Input() eatenApples: Vector3[] = [];
  @Input() renderer: any;

  get lookAtPosition(){ return  this.cubes.first ? this.cubes.first.lookAt : vZero; }

  cubeDiffer: IterableDiffer<any>;
  constructor
  (
    private cdr: ChangeDetectorRef,
    private differs: IterableDiffers
  ) {
    super();
    this.cubeDiffer = this.differs.find([]).create(null);
  }

  cubeLoops = [];
  ngAfterViewInit()
  {
    const keyFrameLoop$ = this.loop$.pipe
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
      }, { futureTime: performance.now() + this.speed } ),
    );
    const directionLoop$ = keyFrameLoop$.pipe( combineLatest( this.directionOnce$ ), share() );

    this.cubes.changes.subscribe( cubes =>
    {
      // camera -> head
      if ( this.cubes.first && this.camera ) this.cubes.first.cube.add( this.camera.camera );

      this.cubeDiffer.diff( cubes ).forEachAddedItem( (_: IterableChangeRecord<SnakeSegmentDir>) =>
      {
        this.cubeLoops.push( directionLoop$.pipe( snakeDelay( _.currentIndex ) ) );
        this.addChild( _.item.object );
      } );

    } );

    const keyFramePosition$ = keyFrameLoop$.pipe
      (
        scan<any, any>( ( [prev], [curr] ) =>
        {
          let select = false;
          if ( prev.futureTime !== curr.futureTime ) select = true;
          return [curr, select];
        }),
        filter( ([ _, select ]) => !!select ),
        map( ([ timeData ]) => [ this.cubes.toArray().map( segment => segment.object.position.round() ), timeData ] ),
    );
    this.position$Change.emit( keyFramePosition$ );

    // this.subLoop$ = this._subLoop$.pipe
    // (
    //   combineLatest
    //   (
    //     this.direction$.asObservable().pipe( startWith( undefined ), switchMap( current => of( current, undefined ) ) )
    //   ),
    //   share(),
    // );

    // this.position$Change.emit( this.subLoop$.pipe
    //   (
    //     scan<any, any>( ( [prev], [curr] ) =>
    //     {
    //       let select = false;
    //       if ( prev.futureTime !== curr.futureTime ) select = true;
    //       return [curr, select];
    //     }),
    //     filter( ([ _, select ]) => !!select ),
    //     map( ([ timeData ]) => [ this.cubes.toArray().map( segment => segment.object.position.round() ), timeData ] ),
    //   ) );

    this.segments = Array( 1 );
    this._object = new Group;
    super.ngAfterViewInit();

  }
  ngOnChanges( changes: SimpleChanges )
  {
  }

  updateCamera( quaternion ) {
    this.camera.camera.up.copy( vY ).applyQuaternion( quaternion ).normalize();
  }

  private direction = new Subject<DirectionCommand>();
  private directionOnce$ = this.direction.asObservable().pipe( startWith( undefined ), switchMap( current => of( current, undefined ) ) );

  @HostListener(`${dkd}w`)
  @HostListener(`${dkd}arrowUp`)
  private arrowUp() { this.direction.next( DirectionCommand.UP ); }

  @HostListener(`${dkd}s`)
  @HostListener(`${dkd}arrowDown`)
  private arrowDown() { this.direction.next( DirectionCommand.DOWN ); }

  @HostListener(`${dkd}a`)
  @HostListener(`${dkd}arrowLeft`)
  private arrowLeft() { this.direction.next( DirectionCommand.LEFT ); }

  @HostListener(`${dkd}d`)
  @HostListener(`${dkd}arrowRight`)
  private arrowRight() { this.direction.next( DirectionCommand.RIGHT ); }

  void() {}
  log( ...args: any[] ) { console.log('…snake…', ...args); }
}
