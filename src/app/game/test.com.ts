import
{
  Component, ViewChild, AfterViewInit, HostListener
} from '@angular/core';
import { RendererCom } from '../three-js';
import { Mesh, BoxBufferGeometry, MeshPhongMaterial, Group, Vector3, Spherical } from 'three';
import { OrbitControlsDir } from '../three-js/control';
import { PerspectiveCameraDir } from '../three-js/camera';

@Component
({
  selector: 'game',
  templateUrl: './main.com.pug',
  styleUrls: ['./main.com.scss'],
})
export class TestCom implements AfterViewInit
{
  @ViewChild(RendererCom) childRenderer: RendererCom;
  @ViewChild(PerspectiveCameraDir) camera: PerspectiveCameraDir;

  private spherical = new Spherical(5);
  @HostListener( 'document:mousemove', ['$event.clientX', '$event.clientY'] )
  mouseMove( clientX: number, clientY: number )
  {
    if ( !this.cube ) return;
    const clientHeight = document.documentElement.clientHeight;
    Object.assign( this.spherical,
    {
     phi: ( clientY / clientHeight ) * Math.PI * 2,
     theta: -( clientX / clientHeight ) * Math.PI * 2
    } );
    this.camera.camera.position.setFromSpherical( this.spherical );
    const v = new Vector3;
    this.cube.localToWorld( v );
    this.camera.camera.lookAt( v );

    this.childRenderer.render();
  }

  @HostListener( 'document:wheel', ['$event.deltaY'] )
  mouseWheel( deltaY: number )
  {
    const radius = Math.max( 2.5, Math.min( 10, this.spherical.radius * ( deltaY < 0 ? .95 : 1.05263157895 ) ) );
    this.spherical.radius = radius;
    this.camera.camera.position.setFromSpherical( this.spherical );
  }

  cube: Mesh;
  ngAfterViewInit()
  {
    const scene = this.childRenderer.sceneComponents.first.object;
    const camera = this.childRenderer.cameraComponents.first.camera;
    const group = new Group;
    const mesh = new Mesh( new BoxBufferGeometry(1, 1, 1), new MeshPhongMaterial({ color: 0xFF33AA }));
    group.add( mesh );
    scene.add( group );
    this.childRenderer.render();
    group.translateZ( 5 );
    group.add( camera );
    this.childRenderer.render();

    const v = new Vector3;
    
    this.childRenderer.render();

    this.cube = mesh;

    setTimeout( () =>
    {
      group.rotateOnAxis( new Vector3( 0, 1, 0), Math.PI / 2 );
      camera.up.applyQuaternion( group.quaternion ).normalize();
      this.childRenderer.render();
    }, 5000 );
    
    setTimeout( () =>
    {
      group.rotateOnAxis( new Vector3( 1, 0, 0), Math.PI / 2 );
      camera.up.applyQuaternion( group.quaternion ).normalize();
      this.childRenderer.render();
    }, 10000 );
  }
}
