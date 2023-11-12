import { Component, AfterViewInit, HostListener, ViewChildren, QueryList, Input,
  forwardRef, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, ChangeDetectorRef, IterableDiffers, IterableDiffer, IterableChangeRecord } from '@angular/core';
import { Subject, Observable, of, defer, combineLatest, NEVER, BehaviorSubject } from 'rxjs';
import { scan, share, startWith, switchMap, map, filter, distinctUntilChanged, mergeAll, tap, withLatestFrom } from 'rxjs/operators';
import { Vector3, Group, Quaternion } from 'three';
import { vZero, vY, vZ, AObject3D, ACamera } from 'angular-three';
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

  @ViewChildren( SnakeSegmentDir ) segments: QueryList<SnakeSegmentDir>;

  segmentPositions: Array<Vector3>;

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

  get lookAtPosition(){ return  this.segments.first ? this.segments.first.lookAt : vZero; }

  cubeDiffer: IterableDiffer<any>;
  constructor
  (
    private cdr: ChangeDetectorRef,
    private differs: IterableDiffers
  ) {
    super();
    this.cubeDiffer = this.differs.find([]).create(null);
  }

  segmentLoops: Observable<any>[] = [];

  // keyframes loop based on speed
  keyFrameLoop$: Observable<any>;
  ngAfterViewInit()
  {
    this.keyFrameLoop$ = this.loop$.pipe
    (
      scan<{ time: number, futureTime: number, delta: number }, { futureTime: number }>( (previous, current) =>
      {
        current.futureTime = previous.futureTime;
        if ( current.time > previous.futureTime  )
        {
          const deltaTime = current.time - current.futureTime;
          if ( deltaTime > this.speed ) // frame drop mitigation?
          {
            current.delta = 16.66;
            current.futureTime = current.time + current.delta;
          }
          else
          {
            current.delta = current.time - current.futureTime;
            current.futureTime += this.speed - deltaTime;
          }
        }
        return current;
      }, { futureTime: performance.now() + this.speed } ),
      share(),
    );

    const directions = [];
    const keyFrameDirection$ = combineLatest
    ( [
      this.keyFrameLoop$,
      this.direction.asObservable().pipe( switchMap( current => of( ...[ current, null ] ) ) )
    ] ) .pipe
    (
      scan( ( [ previous, nextDirection ], [ current, currentDirection ] ) =>
      {
        if ( previous.futureTime !== current.futureTime )
        {
          if ( nextDirection ) directions.push( { direction: nextDirection, exhaust: Array( this.segmentPositions.length ).fill( null ).map( ( _, i ) => i ) } );
          return [ current, null ];
        }
        nextDirection = nextDirection || currentDirection;
        return [ current, nextDirection ];
      }),
      share(),
    );

    // custom operator to delay each cube's direction
    const segmentDefer = ( index: number ) =>
      ( source: Observable<any> ) => source.pipe
      (
        scan<any, any>
        ( (
          [ { futureTime: previousFutureTime } ],
          [ { futureTime, delta, time } ]
        ) =>
        {
          let nextDirection: DirectionCommand;
          if ( previousFutureTime !== futureTime ) for ( const { direction, exhaust } of directions )
            // TODO: remove > 0 items
            // tslint:disable-next-line: no-bitwise
            if ( !~--exhaust[index] ) nextDirection = direction;

          return [ { futureTime, delta, time }, nextDirection ];
        }, [ { futureTime: performance.now() } ] )
      );

    this.segments.changes.subscribe( segments =>
    {
      // add camera to snake head
      if ( this.segments.first && this.camera ) this.segments.first.box.add( this.camera.object );
      this.cubeDiffer.diff( segments ).forEachAddedItem( ( segment: IterableChangeRecord<SnakeSegmentDir>) =>
      {
        directions.forEach( ( { exhaust } ) => exhaust.push( exhaust[ exhaust.length - 1 ] + 1 ) );
        this.segmentLoops.push( keyFrameDirection$.pipe( segmentDefer( segment.currentIndex ) ) );
        // this.speed -= 25;
        this.addChild( segment.item.object );
        this.cdr.detectChanges();
      } );
    } );

    // position based on keyframe
    const keyFramePosition$ = this.keyFrameLoop$.pipe
    (
      scan<{ futureTime: number }, { futureTime: number, select: boolean }>( ( previous, current ) =>
        ( { ...current, select: previous.futureTime !== current.futureTime } ) ),
      filter( ( { select } ) => !!select ),
      map( _ => this.segments.toArray().map( segment => segment.object.position.round() ) ),
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
      this.segmentPositions = Array( 1 ).fill( null );

      // cube loop
      const newSegmentLoop$ = this.keyFrameLoop$.pipe
      (
        withLatestFrom( this.apple$.pipe( startWith( null as any ) ) ),
        scan<[ any, Vector3 ], any>( ( [ previous, appleQueue, [ lastPosition, lastQuaternion ], lastApple ], [ current, apple ] ) =>
        {
          // has eaten an apple
          if ( apple )
          {
            if ( !lastApple || !apple.equals( lastApple ) ) appleQueue.push( this.segmentPositions.length - 1 );
            lastApple = apple.clone();
          }
          if ( lastPosition )
          {
            this.segments.last.object.position.copy( lastPosition );
            this.segments.last.object.quaternion.copy( lastQuaternion );
            [ lastPosition, lastQuaternion ] = [ null, null ];
          }
          if ( previous.futureTime !== current.futureTime )
          {
            appleQueue = appleQueue.reduceRight( ( queueSteps, segmentStep ) =>
            {
              if ( --segmentStep >= 0 ) return [ segmentStep, ...queueSteps ];
              this.segmentPositions.push( null );
              const lastSegment = this.segments.last.object;
              [ lastPosition, lastQuaternion ] = [ lastSegment.position.clone(), lastSegment.quaternion.clone() ];
              this.cdr.detectChanges();
              return [ ...queueSteps ];
            }, [] );
          }
          return [ current, appleQueue, [ lastPosition, lastQuaternion ], lastApple ];
        }, [ { futureTime: null }, [], [ null, null ], null ] ),
        map( _ => this.segmentLoops[ this.segmentLoops.length - 1 ] ),
        distinctUntilChanged(),
        mergeAll(),
      );
      newSegmentLoop$.subscribe();
    }
  }

  updateCamera( quaternion: Quaternion )
  {
    this.camera.object.up.copy( vY ).applyQuaternion( quaternion ).normalize();
  }

  private readonly direction = new BehaviorSubject<DirectionCommand>( null );

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
