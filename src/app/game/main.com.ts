import
{
  Component, ViewChild, NgZone, OnDestroy, AfterViewInit, HostListener, ViewChildren, QueryList, ChangeDetectorRef
} from '@angular/core';
import { RendererCom } from '../three-js';
import { Vector3 } from 'three';
import { interval, animationFrameScheduler, Subject, timer, forkJoin, zip, range } from 'rxjs';
import { map, scan, sampleTime, tap, withLatestFrom, startWith, filter, mergeMap, repeat } from 'rxjs/operators';
import { MeshDir } from '../three-js/object';
import { ThirdPersonControlDir } from '../three-js/control';
import { PerspectiveCameraDir } from '../three-js/camera';

const dkd = 'document:keydown.';
const dirs =
{
  up: [ new Vector3(1, 0, 0), -Math.PI / 2 ],
  down: [ new Vector3(1, 0, 0), Math.PI / 2 ],
  left: [ new Vector3(0, 1, 0), -Math.PI / 2 ],
  right: [ new Vector3(0, 1, 0), Math.PI / 2 ],
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
  @ViewChildren(MeshDir) cubes: QueryList<MeshDir>;
  @ViewChild(ThirdPersonControlDir) control: ThirdPersonControlDir;
  @ViewChild(PerspectiveCameraDir) camera: PerspectiveCameraDir;

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
  private arrowUp() { this.direction$.next( dirs.up ); this.headCube.object.up.copy( new Vector3(1, 0, 0) ); }

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
  private loop$ = interval( 10, animationFrameScheduler )
  .pipe
  (
    map( _ => ({ time: Date.now(), deltaTime: null }) ),
    scan( (previous, current) => ({ time: current.time, deltaTime: (current.time - previous.time) / 1000 }) )
  );

  private seconds$ = zip( range(0, 60), interval( 1000 ), i => i + 1 ).pipe( repeat() );

  @HostListener( 'window:resize', ['$event'] )
  onWindowResize( event: any ) {
    this.childRenderer.onResize( event );
  }

  @HostListener( 'document:mousedown', ['$event'] )
  mouseDown( event: MouseEvent )
  {
    this.control.rotateStartEvent = event;
    this.control.mouseLocked = true;
  }
  @HostListener( 'document:mouseout' )
  @HostListener( 'document:keydown.esc' )
  mouseUp() { this.control.mouseLocked = false; }

  ngOnDestroy()
  {
  }

  headCube: MeshDir;
  ngAfterViewInit()
  {
    this.headCube = this.cubes.first;
    this.cdr.detectChanges();
    
    this.headCube.object.add( this.camera.camera );

    const snake$ = this.direction$.pipe
    (
      filter( dir => undefined !== dir ),
      sampleTime( 1000 ),
      mergeMap( dir => forkJoin
      (
        this.cubes.map( (cube, index) => timer( index * 1000 ).pipe( tap( _ => cube.object.rotateOnAxis.apply( cube.object, dir ) ) ) )
      ) ),
      startWith( undefined ),
    );

    this.loop$.pipe
    (
      withLatestFrom( snake$ ),
      tap( ([{ deltaTime }, _]) =>
      {
        this.cubes.forEach( cube => cube.object.translateZ( deltaTime * this.cubeSize ) );
        this.control.update();
        this.zone.runOutsideAngular( () => this.childRenderer.render() );
      })
    ).subscribe();
  }
}
