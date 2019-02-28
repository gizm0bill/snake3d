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
import { interval, animationFrameScheduler, Subject, zip, range, from, BehaviorSubject, timer, empty } from 'rxjs';
import { scan, tap, withLatestFrom, repeat, share, switchMap } from 'rxjs/operators';
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

  snakeLength = 3;
  snakeSize = 2;
  snakeSpeed = 5000;
  snakePosition = vZero.clone();
  applePosition$ = new BehaviorSubject<Vector3>( vZ.clone().multiplyScalar( this.snakeSize * 5 ) );

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
    return timer( 0, 10, animationFrameScheduler ).pipe
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

  ngAfterViewInit()
  {
    this.cdr.detectChanges();
    return this.loop$.pipe
    (
      // withLatestFrom( this.applePosition$ ),
    )
    .subscribe( _ => this.childRenderer.render() );
  }
}
