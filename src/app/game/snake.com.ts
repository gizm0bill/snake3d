import { Component, AfterViewInit, HostListener, ViewChildren, QueryList, Input,
  forwardRef, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, SimpleChanges, ChangeDetectorRef, IterableDiffers, IterableDiffer, IterableChangeRecord } from '@angular/core';
import { Subject, Observable, never, interval, of, defer, animationFrameScheduler, timer, zip, merge, empty, Subscription } from 'rxjs';
import { scan, share, startWith, switchMap, combineLatest, map, take, throttleTime, tap, filter, withLatestFrom, merge as mergeOperator, last, mergeMap, expand, } from 'rxjs/operators';
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
  private appleOnce$: Observable<any>;

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

  private _cubeLoops = [];
  cubeLoops = new Proxy( this._cubeLoops,
  {
    set: function(target, property, value, receiver) {
      target[property] = value;
      console.log( 'Set %s to %o', property, value);
      return true;
    }
  });
  keyFrameLoop$: Observable<any>;
  ngAfterViewInit()
  {
    this.keyFrameLoop$ = this.loop$.pipe
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

    const directions = [];
    const keyFrameDirection$ = this.keyFrameLoop$.pipe
    (
      combineLatest( this.directionOnce$ ),
      scan( ([prev, holdDir], [curr, dir]) =>
      {
        if ( prev.futureTime !== curr.futureTime )
        {
          if ( holdDir ) directions.push( { dir: holdDir, exhaust: Array(this.segments.length).fill(undefined).map( (_, i) => i ) } );
          return [curr, undefined];
        }
        holdDir = holdDir || dir;
        return [curr, holdDir];
      }),
      share(),
    );

    const snakeDelay_ = ( index: number, tag?: string ) => (source: AnonymousSubject<any>) => defer( () =>
    {
      return source.pipe
      (
        scan<any, any>
        ((
          [ { futureTime: prevFutureTime } ],
          [ { futureTime, delta, time } ]
        ) =>
        {
          let returnDirection: DirectionCommand;
          console.log( prevFutureTime !== futureTime );
          if ( prevFutureTime !== futureTime )
          {
            for ( const direction of directions )
            {
              --direction.exhaust[index];
              if ( direction.exhaust[index] === -1 ) returnDirection = direction.dir;
            }
            console.log( directions );
          }
          return [ { futureTime, delta, time }, returnDirection, tag ];
        }, [{ futureTime: performance.now() }] )
      );
    });

    let cubeLoopsSub: Subscription;
    let appleQueue = [];
    this.cubes.changes.subscribe( cubes =>
    {
      // camera -> head
      if ( this.cubes.first && this.camera ) this.cubes.first.cube.add( this.camera.camera );
      console.log('cubeLoops', this._cubeLoops);
      this.cubeDiffer.diff( cubes ).forEachAddedItem( (_: IterableChangeRecord<SnakeSegmentDir>) =>
      {
        directions.forEach( ({ exhaust }) => exhaust.push( exhaust[exhaust.length -1 ] + 1 ) );
        const l = keyFrameDirection$.pipe( snakeDelay_( _.currentIndex ) );
        this.cubeLoops.push( l );
        this.addChild( _.item.object );

        if ( _.currentIndex > 0 )
        {
          const lastCube = this.cubes.toArray()[ _.currentIndex - 1 ].object;
          this.lastCubePosition.next( [ lastCube.position.clone(), lastCube.quaternion.clone() ] );
        }

        this.cdr.detectChanges();
        // if ( cubeLoopsSub ) cubeLoopsSub.unsubscribe();

        // let lastCubePosition: Vector3,
        //     lastCubeQuaternion: Quaternion;
        // if ( _.currentIndex > 0 )
        // {
        //   const lastCube = this.cubes.toArray()[ _.currentIndex - 1 ].object;
        //   lastCubePosition = lastCube.position.clone();
        //   lastCubeQuaternion = lastCube.quaternion.clone();
        // }

        //
        // cubeLoopsSub = keyFrameLoop$.pipe
        // (
        //   combineLatest( this.appleOnce$ ),
        //   scan<any, any>( ( [prev], [curr, apple] ) =>
        //   {
        //     if ( apple ) appleQueue.push( this.segments.length - 1 );
        //     if ( prev.futureTime !== curr.futureTime )
        //     {
        //       if ( lastCubePosition )
        //       {
        //         this.cubes.last.object.position.copy( lastCubePosition );
        //         this.cubes.last.object.quaternion.copy( lastCubeQuaternion );
        //         [ lastCubePosition, lastCubeQuaternion ] = [ undefined, undefined ];
        //       }
        //       appleQueue = appleQueue.reduceRight( (acc, val) =>
        //       ( --val >= 0
        //         ? [val]
        //         : (
        //             this.segments.push(undefined),
        //             this.cdr.detectChanges(),
        //             []
        //           )
        //       ).concat(acc), [] );
        //     }
        //     return [curr, apple];
        //   }),
        //   expand( _ =>
        //   {
        //     debugger;
        //     return of( true );
        //   })
        //   // mergeOperator( this.cubeLoops[ this.cubeLoops.length - 1 ] )
        // ).subscribe( );
      } );
    } );

    const keyFramePosition$ = this.keyFrameLoop$.pipe
      (
        scan<any, any>( ( prev, curr ) =>
        {
          let select = false;
          if ( prev.futureTime !== curr.futureTime ) select = true;
          return [curr, select];
        }),
        filter( ([ _, select ]) => !!select ),
        map( ([ timeData ]) => [ this.cubes.toArray().map( segment => segment.object.position.round() ), timeData ] ),
    );
    this.position$Change.emit( keyFramePosition$ );

    this._object = new Group;
    super.ngAfterViewInit();

  }

  lastCubePosition = new Subject;
  ngOnChanges( changes: SimpleChanges )
  {
    if ( this.apple$ )
    {
      this.appleOnce$ = this.apple$.pipe( startWith( undefined ), switchMap( current => of( current, undefined ) ) );
      this.segments = Array( 1 ).fill( undefined );

      const empty$ = empty();
      const lastCubePosition$ = this.lastCubePosition.asObservable().pipe( startWith( undefined ) );
      const cubeLoop$ = this.keyFrameLoop$.pipe
      (
        combineLatest( this.appleOnce$ ),
        scan<any, any>( ( [ prev, appleQue, lastCubePos ], [ curr, apple ] ) =>
        {
          if ( apple ) appleQue.push( this.segments.length - 1 );
          if ( prev.futureTime !== curr.futureTime )
          {
            if ( lastCubePos ) {
              this.cubes.last.object.position.copy( lastCubePos[0] );
              this.cubes.last.object.quaternion.copy( lastCubePos[1] );
              lastCubePos = undefined;
            }
            appleQue = appleQue.reduceRight( (acc, val) => {
              if ( --val >= 0 ) {
                return [val].concat(acc);
              }
              this.segments.push(undefined);
              const lastCube = this.cubes.toArray()[ this.cubes.length - 1 ].object;
              lastCubePos = [ lastCube.position.clone(), lastCube.quaternion.clone() ];
              this.cdr.detectChanges();
              return [].concat(acc);
            }, [] );
          }
          return [ curr, appleQue, lastCubePos ];
        }, [ { futureTime: undefined }, [], undefined ] ),
        mergeMap( _ => {
          const lastLoop = this.cubeLoops[ this.cubeLoops.length - 1 ];
          return lastLoop.__subscribed ? empty$ : ( lastLoop.__subscribed = true, lastLoop );
        })
      );
      cubeLoop$.subscribe();
    }
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
