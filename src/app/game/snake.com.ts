import { Component, AfterViewInit, HostListener, ViewChildren, QueryList, Input,
  forwardRef, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, ChangeDetectorRef, IterableDiffers, IterableDiffer, IterableChangeRecord } from '@angular/core';
import { Subject, Observable, never, of, defer } from 'rxjs';
import { scan, share, startWith, switchMap, combineLatest, map, filter, distinctUntilChanged, mergeAll, tap, } from 'rxjs/operators';
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

  @ViewChildren(SnakeSegmentDir) cubes: QueryList<SnakeSegmentDir>;
  // attached camera
  @Input() camera: ACamera<any>;
  // initial speed
  @Input() speed = 1000;
  // initial size
  @Input() size = 1;
  // initial length
  @Input() length = 3;

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
      // console.log( 'Set %s to %o', property, value);
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
          if ( prevFutureTime !== futureTime )
          {
            for ( const direction of directions )
            {
              // TODO
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
      // camera -> head
      if ( this.cubes.first && this.camera ) this.cubes.first.cube.add( this.camera.camera );
      this.cubeDiffer.diff( cubes ).forEachAddedItem( (_: IterableChangeRecord<SnakeSegmentDir>) =>
      {
        directions.forEach( ({ exhaust }) => exhaust.push( exhaust[exhaust.length - 1 ] + 1 ) );
        const l = keyFrameDirection$.pipe( snakeDelay_( _.currentIndex ) );
        this.cubeLoops.push( l );
        this.speed -= 25;
        this.addChild( _.item.object );
        this.cdr.detectChanges();
      } );
    } );

    const keyFramePosition$ = this.keyFrameLoop$.pipe
    (
      scan<any, any>( ( [ prev ], curr ) =>
      {
        let select = false;
        if ( prev.futureTime !== curr.futureTime ) {
          select = true;
        }
        return [ curr, select ];
      }, [ { futureTime: null } ] ),
      filter( ([ _, select ]) => !!select ),
      map( ([ timeData ]) => [ this.cubes.toArray().map( segment => segment.object.position.round() ), timeData ] ),
    );
    this.position$Change.emit( keyFramePosition$ );

    this._object = new Group;
    super.ngAfterViewInit();

  }

  ngOnChanges( )
  {
    if ( this.apple$ )
    {
      this.appleOnce$ = this.apple$.pipe( startWith( undefined ) );
      this.segments = Array( 1 ).fill( undefined );

      const cubeLoop$ = this.keyFrameLoop$.pipe
      (
        combineLatest( this.appleOnce$ ),
        scan<any, any>( ( [ prev, appleQue, lastCubePos, lastApple ], [ curr, apple ]: [ any, Vector3 ] ) =>
        {
          // TODO: anomaly!
          if ( prev.time === curr.time ) {
            return [ curr, appleQue, lastCubePos, lastApple ];
          }
          if ( apple )
          {
            if ( !lastApple || !apple.equals( lastApple ) ) {
              appleQue.push( this.segments.length - 1 );
            }
          }
          if ( lastCubePos )
          {
            this.cubes.last.object.position.copy( lastCubePos[0] );
            this.cubes.last.object.quaternion.copy( lastCubePos[1] );
            lastCubePos = undefined;
          }
          if ( prev.futureTime !== curr.futureTime )
          {
            appleQue = appleQue.reduceRight( (acc, val) =>
            {
              if ( --val >= 0 ) return [val].concat(acc);
              this.segments.push(undefined);
              const lastCube = this.cubes.last.object;
              lastCubePos = [ lastCube.position.clone(), lastCube.quaternion.clone(), lastCube ];
              this.cdr.detectChanges();
              return [].concat(acc);
            }, [] );
          }
          if ( apple ) lastApple = apple.clone();
          return [ curr, appleQue, lastCubePos, lastApple ];
        }, [ { futureTime: undefined }, [], undefined, undefined ] ),
        map( _ => this.cubeLoops[ this.cubeLoops.length - 1 ] ),
        distinctUntilChanged(),
        mergeAll(),
      );
      cubeLoop$.subscribe();
    }
  }

  updateCamera( quaternion: Quaternion )
  {
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
