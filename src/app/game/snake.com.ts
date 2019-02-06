import { Component, AfterViewInit, HostListener, ViewChildren, QueryList, Input } from '@angular/core';
import { Subject, timer, Observable, never } from 'rxjs';
import { sampleTime, tap, startWith, filter, mergeMap, take } from 'rxjs/operators';
import { Vector3 } from 'three';
import { MeshDir, deg90, vY, vX, vZero } from '../three-js';

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
  selector: 'game-snake',
  templateUrl: './snake.com.pug',
})
export class SnakeCom implements AfterViewInit
{
  @ViewChildren(MeshDir) cubes: QueryList<MeshDir>;
  @Input() speed = 1000;
  @Input() size = 2;
  @Input() length = 3;
  segments: Array<Vector3>;
  snake$: Observable<any> = never();
  ngAfterViewInit()
  {
    this.segments = Array( this.length )
      .fill( undefined )
      .map( ( _, index ) => vZero.clone().sub( new Vector3( 0, 0, this.size * index ) ) );

    this.snake$ = this.direction$.pipe
    (
      filter( dir => !!dir ),
      sampleTime( this.speed ),
      mergeMap( ( [ axis, angle ]: [ Vector3, number ] ) =>
      {
        const cubesArray = this.cubes.toArray().map( ( { object } ) => object );
        // return merge(
        return timer( 0, this.speed ).pipe( take( this.length ), tap( idx => cubesArray[idx].rotateOnAxis( axis, angle ) ) );
        // );
      }),
      startWith( undefined )
    );
  }

  private direction$ = new Subject;

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

}
