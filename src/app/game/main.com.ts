import { Component, ViewChild, NgZone, OnDestroy, AfterViewInit, HostListener, ViewChildren, QueryList } from '@angular/core';
import { RendererCom } from '../three-js';
import { Vector3, PerspectiveCamera } from 'three';
import { interval, animationFrameScheduler, combineLatest, Subject, BehaviorSubject, timer, forkJoin } from 'rxjs';
import { map, scan, sampleTime, tap, withLatestFrom, startWith, distinctUntilChanged, filter, sample, merge, mergeMap, concatMap, defaultIfEmpty } from 'rxjs/operators';
import { MeshDir } from '../three-js/object';

const ls = 'document:keydown.';
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

  private refreshInterval: any;
  cubeSize = 2;
  snakeSegments = [];
  constructor( private readonly zone: NgZone )
  {
    const start = new Vector3( 0, 0, 0 );
    this.snakeSegments = Array( 3 )
      .fill( undefined )
      .map( ( _, index ) => start.clone().sub( new Vector3( 0, 0, this.cubeSize * index ) ) );
  }

  @HostListener(`${ls}arrowUp`) private arrowUp() { this.direction$.next( dirs.up ); }
  @HostListener(`${ls}arrowDown`) private arrowDown() { this.direction$.next( dirs.down ); }
  @HostListener(`${ls}arrowLeft`) private arrowLeft() { this.direction$.next( dirs.left ); }
  @HostListener(`${ls}arrowRight`) private arrowRight() { this.direction$.next( dirs.right ); }

  private direction$ = new Subject;
  private loop$ = interval( 10, animationFrameScheduler )
  .pipe
  (
    map( _ => ({ time: Date.now(), deltaTime: null }) ),
    scan( (previous, current) => ({ time: current.time, deltaTime: (current.time - previous.time) / 1000 }) )
  );

  private seconds$ = interval( 1000 );

  private renderer: any;
  @HostListener( 'window:resize', ['$event'] )
  onWindowResize( event: any ) {
    this.renderer.onResize( event );
  }
  ngOnDestroy()
  {
  }

  ngAfterViewInit()
  {
    const snake$ = this.direction$.pipe
    (
      filter( dir => undefined !== dir ),
      sampleTime( 1000 ),
      // distinctUntilChanged(),
      mergeMap( dir => forkJoin
      (
        this.cubes.map( (cube, index) => timer( index * 1000 ).pipe( tap( _ => cube.object.rotateOnAxis.apply( cube.object, dir ) ) ) )
      ) ),
      startWith( undefined ),
    );


    this.loop$.pipe
    (
      withLatestFrom( snake$ ),
      // merge( x ),
      tap( ([{ deltaTime }, _]) =>
      {
        this.cubes.forEach( cube => cube.object.translateZ( deltaTime * this.cubeSize / 1 ) );
        // const camera =  ( this.renderer.cameraComponents.first.camera as PerspectiveCamera );
        // camera.position.copy( this.cubes.first.object.position.clone().sub( new Vector3(0, -5, 5) ) );
        // camera.lookAt( this.cubes.first.object.position );
        this.zone.runOutsideAngular( () => this.renderer.render() );
      })
    ).subscribe();


    this.renderer = this.childRenderer;
    // setTimeout( this.renderer.onResize.bind(renderer), 500 ); // TODO: animation end from unloaded component
    // this.zone.runOutsideAngular( () =>
    //   this.refreshInterval = setInterval( () =>
    //   {
    //     this.renderer.render();
    //   }, 29) );
  }
}
