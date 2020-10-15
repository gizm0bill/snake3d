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
import { RendererCom, deg90, vY, vX, vZero, vZ, PerspectiveCameraDir, SceneDir } from 'angular-three';
import { Vector3, Spherical, Box3, Box3Helper, Color } from 'three';
import { interval, animationFrameScheduler, Subject, zip, range, BehaviorSubject, timer, Observable, EMPTY, Subscription } from 'rxjs';
import { scan, tap, repeat, share, switchMap, map, delay, filter } from 'rxjs/operators';
import { SnakeCom } from './snake.com';
import { AppleCom } from './apple.com';
import { BoxCom } from './box.com';

const { PI, floor, random, min, max } = Math;

@Component
({
  selector: 'game',
  templateUrl: './main.com.pug',
  styleUrls: ['./main.com.scss'],
})
export class MainCom implements OnDestroy, AfterViewInit
{
  constructor
  (
    private readonly zone: NgZone,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  // simple seconds counter
  public seconds$ = zip( range(0, 60), interval( 1000 ) ).pipe( map( ( [ i ] ) => i + 1 ), repeat(),  );

  @ViewChild(RendererCom) childRenderer: RendererCom;
  @ViewChild(PerspectiveCameraDir) camera: PerspectiveCameraDir;
  @ViewChild(SnakeCom) snake: SnakeCom;
  @ViewChild(AppleCom) apple: AppleCom;
  @ViewChild(SceneDir) scene: SceneDir;
  @ViewChild(BoxCom) gameBox: BoxCom;

  pauseResume$ = new BehaviorSubject<boolean>( true );
  @HostListener(`document:keydown.space`)
  private pauseResume() { this.pauseResume$.next( true ); }

  snakeLength = 3;
  snakeSize = 1;
  snakeSpeed = 1500;
  private applePosition = new BehaviorSubject<Vector3>( vZ.clone().multiplyScalar( this.snakeSize * 2 ) );

  applePosition$ = this.applePosition.asObservable().pipe( delay( this.snakeSpeed / 2, animationFrameScheduler ) );

  @HostListener( 'window:resize', ['$event'] )
  onWindowResize( event: any ) { this.childRenderer.onResize( event ); }

  // using a sphere to calculate camera movement around the snake head
  private spherical = new Spherical(10);
  // Move camera around head on a sphere
  @HostListener( 'document:mousemove', [ '$event.clientX', '$event.clientY' ] )
  mouseMove( clientX: number, clientY: number )
  {
    const { clientHeight, clientWidth } = document.documentElement;
    this.spherical.phi = -( clientY * PI / clientHeight );
    this.spherical.theta = -( clientX * 2 * PI / clientWidth ) + PI;
    this.camera.object.position.setFromSpherical( this.spherical );
    if ( this.snake ) this.camera.object.lookAt( this.snake.lookAtPosition );
  }
  // Increase camera radius on scroll
  @HostListener( 'document:wheel', ['$event.deltaY'] )
  mouseWheel( deltaY: number )
  {
    // maximum radius 25
    this.spherical.radius = min( 25, this.spherical.radius * ( deltaY < 0 ? .95 : 1.05 ) );
    this.camera.object.position.setFromSpherical( this.spherical );
  }

  // start a new loop
  private newLoop()
  {
    return timer( 0, 1000 / 10, animationFrameScheduler ).pipe
    (
      scan<any, { time: number, delta: number }>( previous =>
      {
        const time = performance.now();
        return { time, delta: time - previous.time };
      }, { time: performance.now(), delta: 0 } ),
      share()
    );
  }
  // main game loop with pause functionality
  loop$ = this.pauseResume$.pipe( scan( p => !p ), switchMap( resume => resume ? this.newLoop() : EMPTY ) );
  private subscription = new Subscription;

  gridSize = 5;
  private randomApplePosition( snakePositions: Vector3[] )
  {
    let newPos: Vector3;
    const newPosFn = () => floor( random() * ( this.gridSize + this.gridSize + 1 ) - this.gridSize ) * this.snakeSize;
    do { newPos = new Vector3( newPosFn(), newPosFn(), newPosFn() ); }
    while ( snakePositions.find( pos => !!pos.round().equals( newPos ) ) );
    return newPos;
  }
  snakePosition$: Observable<Vector3[]>;
  apple$: Observable<any>;
  ngAfterViewInit()
  {
    // set initial camera position
    this.mouseMove( document.body.clientWidth / 2, document.body.clientHeight * .33 );
    this.apple$ = this.snakePosition$.pipe
    (
      filter( ( snakePositions ) => this.applePosition.value.equals( snakePositions[0] ) ),
      // tap( _ => this.applePosition.next( this.applePosition.value.clone().add( vZ.clone().multiplyScalar( this.snakeSize * 10 ) ) ) ),
      tap( ( snakePositions ) =>
      {
        const newApple = this.randomApplePosition( snakePositions );
        this.applePosition.next( newApple );
        // TODO: increase score
        // this.eatenApples.push( this.snakePosition[0].clone() );
      } ),
      map( ( [ snakePosition ] ) => snakePosition.clone() ),
    );
    this.subscription.add( this.loop$.subscribe( _ => this.zone.runOutsideAngular( __ => this.childRenderer.render() ) ) );

    const box = new Box3();
    box.setFromObject( this.gameBox.object );
    const snakeHeadBox = new Box3;
    this.scene.object.add( new Box3Helper( box, new Color( 0x000000 ) ) );
    this.subscription.add( this.snakePosition$.subscribe( ( positions ) =>
    {
      snakeHeadBox.setFromCenterAndSize( positions[0], new Vector3( this.snakeSize, this.snakeSize, this.snakeSize ) );
      console.log( !box.containsBox( snakeHeadBox ) ? 'game over' : positions[0] );
    } ) );
    this.cdr.detectChanges();
  }

  ngOnDestroy()
  {
    this.subscription.unsubscribe();
  }
}
