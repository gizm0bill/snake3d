import
{
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  HostListener,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { RendererCom, deg90, vY, vX, vZero, vZ } from '../three-js';
import { Vector3, Spherical } from 'three';
import { interval, animationFrameScheduler, Subject, zip, range, from, BehaviorSubject, timer, empty, of, Observable } from 'rxjs';
import { scan, tap, withLatestFrom, repeat, share, switchMap, map, delay, filter } from 'rxjs/operators';
import { PerspectiveCameraDir } from '../three-js/camera';
import { SnakeCom } from './snake.com';
import { AppleCom } from './apple.com';

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
  @ViewChild(AppleCom) apple: AppleCom;


  constructor
  (
    private readonly zone: NgZone,
    private readonly cdr: ChangeDetectorRef,
  )
  {

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

  snakeLength = 3;
  snakeSize = 2;
  snakeSpeed = 2000;
  private applePosition = new BehaviorSubject<Vector3>( vZ.clone().multiplyScalar( this.snakeSize * 2 ) );
  applePosition$ = this.applePosition.asObservable().pipe( delay( this.snakeSpeed / 2, animationFrameScheduler ) );
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
    if ( this.snake ) this.camera.camera.lookAt( this.snake.lookAtPosition );
  }

  @HostListener( 'document:wheel', ['$event.deltaY'] )
  mouseWheel( deltaY: number )
  {
    const radius = Math.max( 2.5, Math.min( 25, this.spherical.radius * ( deltaY < 0 ? .95 : 1.05263157895 ) ) );
    this.spherical.radius = radius;
    this.camera.camera.position.setFromSpherical( this.spherical );
  }


  pauseResume$ = new BehaviorSubject<boolean>(false).pipe( scan( p => !p, false ) );
  ngOnDestroy()
  {
  }
  private newLoop()
  {
    return timer( 0, 1000 / 6, animationFrameScheduler ).pipe
    (
      scan<any, { time: number, delta: number }>( previous =>
      {
        const time = performance.now();
        return { time, delta: time - previous.time };
      }, { time: performance.now(), delta: 0 } ),
      share()
    );
  }
  loop$ = this.pauseResume$.pipe( switchMap( resume => resume ? this.newLoop() : empty() ) );

  gridSize = 5;
  private randomApplePosition( snakePositions: Vector3[] )
  {
    let newPos: Vector3;
    const newPosFn = () => Math.floor( Math.random() * ( this.gridSize + this.gridSize + 1 ) - this.gridSize ) * this.snakeSize;
    do { newPos = new Vector3( newPosFn(), newPosFn(), newPosFn() ); }
    while ( snakePositions.find( pos => !!pos.round().equals( newPos ) ) );
    return newPos;
  }
  eatenApples = [];
  snakePosition$: Observable<[ Vector3[], { time: number, delta: number, futureTime: number} ]>;
  apple$: Observable<any>;
  ngAfterViewInit()
  {
    this.apple$ = this.snakePosition$.pipe
    (
      filter( ([ [ snakePosition ] ]) => this.applePosition.value.equals( snakePosition ) ),
      map( ([ [ snakePosition ] ]) => snakePosition ),
      tap( _ => this.applePosition.next( this.applePosition.value.clone().add( vZ.clone().multiplyScalar( this.snakeSize * 4 ) ) ) )
      // {
        // if ( this.applePosition.value.equals( snakePosition ) )
        // {
        //   // this.applePosition.next( this.randomApplePosition() );
        //   // this.applePosition.next( this.applePosition.value.clone().add( vZ.clone().multiplyScalar( this.snakeSize * 2 ) ) );
        //   // this.eatenApples.push( this.snakePosition[0].clone() );
        // }
      // } ),
    );
    this.loop$.subscribe( _ => this.zone.runOutsideAngular( __ => this.childRenderer.render() ) );
    this.cdr.detectChanges();

  }
}
