import
{
  Component, ViewChild, NgZone, OnDestroy, AfterViewInit, HostListener, ViewChildren, QueryList, ChangeDetectorRef
} from '@angular/core';
import { RendererCom, deg90, vY, vX, vZero, vZ } from '../three-js';
import { Vector3, Spherical} from 'three';
import { interval, animationFrameScheduler, Subject, timer, forkJoin, zip, range, of, merge, Observable, BehaviorSubject } from 'rxjs';
import { map, scan, sampleTime, tap, withLatestFrom, startWith, filter, mergeMap, repeat, take, share } from 'rxjs/operators';
import { MeshDir } from '../three-js/object';
import { PerspectiveCameraDir } from '../three-js/camera';
import { SnakeCom } from './snake.com';

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
  selector: 'game',
  templateUrl: './main.com.pug',
  styleUrls: ['./main.com.scss'],
})
export class MainCom implements OnDestroy, AfterViewInit
{
  @ViewChild(RendererCom) childRenderer: RendererCom;
  @ViewChild(PerspectiveCameraDir) camera: PerspectiveCameraDir;
  @ViewChild(SnakeCom) snake: SnakeCom;

  cubeSize = 2;
  snakeSegments = [];
  constructor
  (
    private readonly zone: NgZone,
    private readonly cdr: ChangeDetectorRef,
  )
  {
    const start = new Vector3( 0, 0, 0 );
    this.snakeSegments = Array( 3 )
      .fill( undefined )
      .map( ( _, index ) => start.clone().sub( new Vector3( 0, 0, this.cubeSize * index ) ) );

  }

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

  private direction$ = new Subject;
  // private loop$ = interval( 10, animationFrameScheduler )
  // .pipe
  // (
  //   map( _ => ({ time: Date.now(), deltaTime: null }) ),
  //   scan( (previous, current) => ({ time: current.time, deltaTime: (current.time - previous.time) / 1000 }) )
  // );

  snakePosition = vZero.clone();

  private seconds$ = zip( range(0, 60), interval( 1000 ), i => i + 1 ).pipe( repeat(),  );

  @HostListener( 'window:resize', ['$event'] )
  onWindowResize( event: any ) {
    this.childRenderer.onResize( event );
  }

  private spherical = new Spherical(10);
  @HostListener( 'document:mousemove', ['$event.clientX', '$event.clientY'] )
  mouseMove( clientX: number, clientY: number )
  {
    const clientHeight = document.documentElement.clientHeight;
    Object.assign( this.spherical,
    {
     phi: ( clientY / clientHeight ) * Math.PI * 2,
     theta: -( clientX / clientHeight ) * Math.PI * 2
    } );
    this.camera.camera.position.setFromSpherical( this.spherical );
    this.camera.camera.lookAt( this.snake.lookAtPosition );
  }

  @HostListener( 'document:wheel', ['$event.deltaY'] )
  mouseWheel( deltaY: number )
  {
    const radius = Math.max( 2.5, Math.min( 25, this.spherical.radius * ( deltaY < 0 ? .95 : 1.05263157895 ) ) );
    this.spherical.radius = radius;
    this.camera.camera.position.setFromSpherical( this.spherical );
  }

  ngOnDestroy()
  {
  }

  private loop$ = interval( 10, animationFrameScheduler ).pipe
  (
    scan<any, { time: number, delta: number }>( previous =>
    {
      const time = performance.now();
      return { time, delta: time - previous.time };
    }, { time: performance.now(), delta: 0 } ),
    share()
  );

  snakeBehavior$: Observable<any>;
  private readonly _impulse$ = new BehaviorSubject<{ time: number, delta: number }>( undefined );
  impulse$ = this._impulse$.pipe( filter( t => !!t ), share() );
  ngAfterViewInit()
  {

    this.cdr.detectChanges();

    const comps = [0, 1, 2];
    this.loop$.pipe
    (
      tap( time => this._impulse$.next(time) ),
      withLatestFrom( this.snakeBehavior$ ),
      tap( ([{ delta }, _]) =>
      {
        // this.snakePosition.add( vZ.clone().multiplyScalar( delta * this.cubeSize / 1000 ) );
        // this.cubes.forEach( cube =>
        // {
        //   const cubeObj = cube.object;
        //   cubeObj.translateZ( deltaTime * this.cubeSize );
        //   // 'normalize' other axes
        //   comps.forEach( compIdx =>
        //   {
        //     const comp = cubeObj.position.getComponent( compIdx );
        //     if ( cubeObj.userData.lastPosition && comp === cubeObj.userData.lastPosition.getComponent( compIdx ) )
        //       cubeObj.position.setComponent( compIdx, Math.round(comp) );
        //   } );
        //   cubeObj.userData.lastPosition = cube.object.position.clone();
        // } );
        this.zone.runOutsideAngular( () => this.childRenderer.render() );
      })
    ).subscribe();
  }
}
