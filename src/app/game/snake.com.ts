import { Component, AfterViewInit, HostListener, ViewChildren, QueryList, Input,
  forwardRef, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, ChangeDetectorRef, IterableDiffers, IterableDiffer, IterableChangeRecord } from '@angular/core';
import { Subject, Observable, of, defer, combineLatest, NEVER } from 'rxjs';
import { scan, share, startWith, switchMap, map, filter, distinctUntilChanged, mergeAll, tap } from 'rxjs/operators';
import { Vector3, Group, Quaternion } from 'three';
import { vZero, vY, vZ } from '../three-js';
import { AObject3D } from '../three-js/object-3d';
import { ACamera } from '../three-js/camera';
import { SnakeSegmentDir, DirectionCommand } from './snake/segment.dir';
import { AnonymousSubject } from 'rxjs/internal/Subject';

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

  // attached camera
  @Input() camera: ACamera<any>;
  // initial speed
  @Input() speed = 10000;
  // initial size
  @Input() size = 1;
  // initial length
  @Input() length = 3;

  @ViewChildren(SnakeSegmentDir) cubes: QueryList<SnakeSegmentDir>;

  cubePositions: Array<Vector3>;

  // TODO: not used anymore?
  @Input() behavior$: Observable<any> = NEVER;
  @Output() behavior$Change = new EventEmitter<Observable<any>>();

  @Input() loop$: Observable<{ time: number, delta: number}>;
  @Output() loop$Change = new EventEmitter<Observable<any>>();

  @Input() subLoop$: Observable<any>;

  // TODO: not used
  @Input() position$: Observable<any>;
  // Emit position to parent
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
      // console.log( 'Set %s to %o', property, value);
      return true;
    }
  });
  // keyframes loop based on speed
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
          if ( dt > this.speed ) // frame drop mitigation?
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
      share(),
    );

    const directions = [];
    const keyFrameDirection$ = combineLatest( [ this.keyFrameLoop$, this.directionOnce$ ] ) .pipe
    (
      scan( ( [ previous, holdDirection ], [ current, direction ] ) =>
      {
        if ( previous.futureTime !== current.futureTime )
        {
          if ( holdDirection ) directions.push( { dir: holdDirection, exhaust: Array(this.cubePositions.length).fill(undefined).map( (_, i) => i ) } );
          return [ current, undefined ];
        }
        holdDirection = holdDirection || direction;
        return [ current, holdDirection ];
      }),
      share(),
    );

    // custom operator to delay each cube's direction
    const snakeDelay = ( index: number, tag?: string ) => ( source: AnonymousSubject<any> ) => defer( () =>
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
          if ( prevFutureTime !== futureTime )
          {
            for ( const direction of directions )
            {
              // TODO: remove > 0 items
              --direction.exhaust[index];
              if ( direction.exhaust[index] === -1 ) returnDirection = direction.dir;
            }
          }
          return [ { futureTime, delta, time }, returnDirection, tag ];
        }, [{ futureTime: performance.now() }] )
      );
    });

    this.cubes.changes.subscribe( cubes =>
    {
      // add camera to snake head
      if ( this.cubes.first && this.camera ) this.cubes.first.cube.add( this.camera.object );
      this.cubeDiffer.diff( cubes ).forEachAddedItem( (_: IterableChangeRecord<SnakeSegmentDir>) =>
      {
        directions.forEach( ({ exhaust }) => exhaust.push( exhaust[exhaust.length - 1 ] + 1 ) );
        const l = keyFrameDirection$.pipe( snakeDelay( _.currentIndex ) );
        this.cubeLoops.push( l );
        // this.speed -= 25;
        this.addChild( _.item.object );
        this.cdr.detectChanges();
      } );
    } );

    // position based on keyframe
    const keyFramePosition$ = this.keyFrameLoop$.pipe
    (
      scan<any, any>( ( [ prev ], curr ) =>
      {
        let select = false;
        if ( prev.futureTime !== curr.futureTime ) select = true;
        return [ curr, select ];
      }, [ { futureTime: null } ] ),
      filter( ( [ _, select ] ) => !!select ),
      map( ( [ timeData ] ) => [ this.cubes.toArray().map( segment => segment.object.position.round() ), timeData ] ),
      share()
    );
    this.position$Change.emit( keyFramePosition$ );

    this._object = new Group;
    super.ngAfterViewInit();
  }

  ngOnChanges( )
  {
    if ( this.apple$ )
    {
      this.appleOnce$ = this.apple$.pipe( startWith( null as any ) );
      this.cubePositions = Array( 1 ).fill( undefined );

      // cube loop
      const cubeLoop$ = combineLatest( [ this.keyFrameLoop$, this.appleOnce$ ] ).pipe
      (
        scan<any, any>( ( [ prev, appleQueue, lastCubePos, lastApple ], [ curr, apple ]: [ any, Vector3 ] ) =>
        {
          // TODO: anomaly!
          if ( prev.time === curr.time ) {
            return [ curr, appleQueue, lastCubePos, lastApple ];
          }
          if ( apple ) // has eaten an apple
          {
            if ( !lastApple || !apple.equals( lastApple ) ) {
              appleQueue.push( this.cubePositions.length - 1 );
            }
          }
          if ( lastCubePos )
          {
            this.cubes.last.object.position.copy( lastCubePos[0] );
            this.cubes.last.object.quaternion.copy( lastCubePos[1] );
            lastCubePos = null;
          }
          if ( prev.futureTime !== curr.futureTime )
          {
            appleQueue = appleQueue.reduceRight( (acc, val) =>
            {
              if ( --val >= 0 ) return [val].concat(acc);
              this.cubePositions.push( null );
              const lastCube = this.cubes.last.object;
              lastCubePos = [ lastCube.position.clone(), lastCube.quaternion.clone(), lastCube ];
              this.cdr.detectChanges();
              return [].concat(acc);
            }, [] );
          }
          if ( apple ) lastApple = apple.clone();
          return [ curr, appleQueue, lastCubePos, lastApple ];
        }, [ { futureTime: null }, [], null, null ] ),
        map( _ => this.cubeLoops[ this.cubeLoops.length - 1 ] ),
        distinctUntilChanged(),
        mergeAll(),
      );
      cubeLoop$.subscribe();
    }
  }

  updateCamera( quaternion: Quaternion )
  {
    this.camera.object.up.copy( vY ).applyQuaternion( quaternion ).normalize();
  }

  private direction$ = new Subject<DirectionCommand>();
  private directionOnce$ = this.direction$.asObservable().pipe
  (
    startWith( null as any ),
    switchMap( current => of( ...[ current, null ] ) )
  );

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

  void() {}
  log( ...args: any[] ) { console.log('…snake…', ...args); }
}
