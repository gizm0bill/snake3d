import
{
  Component, ViewChild, NgZone, OnDestroy, AfterViewInit, HostListener, ViewChildren, QueryList, ChangeDetectorRef
} from '@angular/core';
import { RendererCom, deg90, vY, vX, vZero } from '../three-js';
import { Vector3, Spherical, LineBasicMaterial, Geometry, Line, Matrix4, CameraHelper } from 'three';
import { interval, animationFrameScheduler, Subject, timer, forkJoin, zip, range, of, merge } from 'rxjs';
import { map, scan, sampleTime, tap, withLatestFrom, startWith, filter, mergeMap, repeat, take } from 'rxjs/operators';
import { MeshDir } from '../three-js/object';
import { ThirdPersonControlDir } from '../three-js/control';
import { PerspectiveCameraDir } from '../three-js/camera';

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

  private spherical = new Spherical(5);
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
    this.camera.camera.lookAt( this.headCube.object.position );
  }

  @HostListener( 'document:wheel', ['$event.deltaY'] )
  mouseWheel( deltaY: number )
  {
    const radius = Math.max( 2.5, Math.min( 10, this.spherical.radius * ( deltaY < 0 ? .95 : 1.05263157895 ) ) );
    this.spherical.radius = radius;
    this.camera.camera.position.setFromSpherical( this.spherical );
  }

  ngOnDestroy()
  {
  }

  headCube: MeshDir;
  ngAfterViewInit()
  {
    this.headCube = this.cubes.first;
    const m = new LineBasicMaterial({ color: 0x0000ff });
    const g = new Geometry;
    console.log( this.headCube.object.up.clone().multiplyScalar(10) );
    g.vertices.push( vZero );
    g.vertices.push( this.headCube.object.up.clone().multiplyScalar(10) );
    const l = new Line(g, m);
    
    this.headCube.object.add( l );
    this.headCube.object.add( this.camera.camera );
    const cameraHelper = new CameraHelper( this.camera.camera );
    this.headCube.object.add( cameraHelper );

    this.cdr.detectChanges();

    const
      camera = this.camera.camera,
      headCubeObj = this.headCube.object;

    const snake$ = this.direction$.pipe
    (
      filter( dir => undefined !== dir ),
      sampleTime( 1000 ),
      mergeMap( ( [ axis, angle ]: [ Vector3, number ] ) =>
      {
        const
          rotateCamera = timer( 0 ).pipe( tap( _ => camera.up.copy( vY ).applyQuaternion( headCubeObj.quaternion ).normalize() ) ),
          cubesArray = this.cubes.toArray();
        return merge
        (
          timer( 0, 1000 ).pipe
          (
            take( this.cubes.length ),
            tap( idx => cubesArray[idx].object.rotateOnAxis( axis, angle ) ),
          ),
          rotateCamera,
        );
      } ),
      startWith( undefined ),
    );

    const comps = [0, 1, 2];
    this.loop$.pipe
    (
      withLatestFrom( snake$ ),
      tap( ([{ deltaTime }, _]) =>
      {
        this.cubes.forEach( cube =>
        {
          const cubeObj = cube.object;
          cubeObj.translateZ( deltaTime * this.cubeSize );
          // 'normalize' other axes
          comps.forEach( compIdx =>
          {
            const comp = cubeObj.position.getComponent( compIdx );
            if ( cubeObj.userData.lastPosition && comp === cubeObj.userData.lastPosition.getComponent( compIdx ) )
              cubeObj.position.setComponent( compIdx, Math.round(comp) );
          } );
          cubeObj.userData.lastPosition = cube.object.position.clone();
        } );
        this.zone.runOutsideAngular( () => this.childRenderer.render() );
      })
    ).subscribe();
  }
}
