import { Component, AfterViewInit, HostListener, ViewChildren, QueryList, Input,
  forwardRef, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { Subject, Observable, never, interval, of, defer, animationFrameScheduler, timer } from 'rxjs';
import { scan, share, startWith, switchMap, combineLatest, map, take, throttleTime, tap, filter, } from 'rxjs/operators';
import { Vector3, Group } from 'three';
import { vZero, vY } from '../three-js';
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
      [ { futureTime, delta }, currentDirection ]
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
      return [ { futureTime, delta }, retDirection, tag ];
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
  void() {}
  log( ...args: any[] ) { console.log('…snake…', ...args); }
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

  trackByFn( index: number, vector: Vector3 )
  {
    return `${index}:${vector.toArray().join()}`;
  }
  constructor( private cdr: ChangeDetectorRef ) {
    super();
  }

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
          // if ( this.eatenApples[0] && this.cubes.last.object.position.equals( this.eatenApples[0] ) )
          // {
          //   timer( this.speed, animationFrameScheduler ).pipe( tap( _ =>
          //   {
          //     this.segments.push(this.eatenApples.shift());
          //     this.cdr.detectChanges();
          //   } ) ).subscribe();
          // }

        }
        return current;
      }, { futureTime: performance.now() + this.speed } ),
      combineLatest
      (
        this.direction$.asObservable().pipe( startWith( undefined ), switchMap( current => of( current, undefined ) ) )
      ),
      share(),
    );

    this.position$Change.emit( this.subLoop$.pipe
      (
        scan<any, any>( ( [prev], [curr] ) =>
        {
          let select = false;
          if ( prev.futureTime !== curr.futureTime ) select = true;
          return [curr, select];
        }),
        filter( ([ _, select ]) => !!select ),
        map( ([ timeData ]) => [ this.cubes.toArray().map( segment => segment.object.position.round() ), timeData ] ),
      ) );

    this.segments = Array( +this.length )
      .fill( undefined )
      .map( ( _, index ) => vZero.clone().sub( this.position.clone().add( new Vector3( 0, 0, +this.size * index ) ) ) );
    this._object = new Group;
    this.cubes.changes.subscribe( _ =>
    {
      this.object.add( ...this.cubes.map( ( { object } ) => object ) );
      if ( this.cubes.first && this.camera ) // camera -> head
        this.cubes.first.cube.add( this.camera.camera );
    });
    super.ngAfterViewInit();
    this.cdr.detectChanges();
    this.cdr.detach();

    // interval( this.speed ).pipe(
    //   filter( i => {
    //     if ( i % 7 === 0 || i % 8 === 0 ) return true;
    //     return false;
    //   } ),
    //   tap( _ => this.direction$.next( DirectionCommand.LEFT ) )
    // ).subscribe();

    // setTimeout( () => this.direction$.next( DirectionCommand.UP ), 100 );
    // setTimeout( () => this.direction$.next( DirectionCommand.RIGHT ), 4500 );
    // setTimeout( () => this.direction$.next( DirectionCommand.DOWN ), 6000 );

    // const x = this.subLoop$.pipe( snakeDelay( 1, 'test' ) ),
    // x1 = x.pipe( snakeDelay( 1, 'test2' ) );
    // x.subscribe( console.log.bind( undefined, '1…' ) );
    // x1.subscribe( console.log.bind( undefined, '2…' ) );
  }

  ngOnChanges( changes: SimpleChanges )
  {
    if ( changes.apple$ && changes.apple$.currentValue )
      this.apple$.subscribe( _ => this.eatenApples.push( _.clone() ) );
  }

  updateCamera( quaternion ) {
    this.camera.camera.up.copy( vY ).applyQuaternion( quaternion ).normalize();
  }

  loop4Segment( index: number ) { return this.subLoop$.pipe( snakeDelay( index, `seg ${index}` ) ); }

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
