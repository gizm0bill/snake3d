import { AfterViewInit, Component, NgZone, ViewChild } from '@angular/core';
import { RendererCom, SceneDir } from 'angular-three';

@Component
( {
  selector: 'demo-com',
  styles: [ ':host { display: block; height: 100%; }' ],
  template: `
    <three-orbit-controls>
      <three-renderer color='#FF0080'>
        <three-perspective-camera [fov]="60" [near]="1" [far]="1100" [positionX]="15" [positionY]="10" [positionZ]="-15"></three-perspective-camera>
        <three-scene>
          <three-axes-helper [size]='10'></three-axes-helper>
          <three-grid-helper [size]='30' [divisions]='10'></three-grid-helper>
          <three-ambient-light color='#000000'></three-ambient-light>
          <three-point-light color='#FFFFFF' position=" 0, 50, 20 "></three-point-light>
          <three-mesh>
            <three-sphere-buffer-geometry [radius]='5'></three-sphere-buffer-geometry>
            <three-lambert-material></three-lambert-material>
          </three-mesh>
        </three-scene>
      </three-renderer>
    </three-orbit-controls>
  `
} )
export class DemoCom implements AfterViewInit
{
  @ViewChild( RendererCom ) renderer: RendererCom;
  @ViewChild( SceneDir ) scene: SceneDir;

  constructor( private readonly zone: NgZone ) {}

  ngAfterViewInit()
  {
    // might make a performance difference
    this.zone.runOutsideAngular( _ =>
    {
      const animate = () =>
      {
        requestAnimationFrame( animate );
        this.renderer.render();
      };
      animate();
    } );
  }
}
