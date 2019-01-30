import { Directive, Input, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { ACamera } from '../camera';
import { AObject3D } from '../object-3d';
import { Object3D, Camera, Vector3, Vector2 } from 'three';

enum STATE { NONE, ROTATE, ZOOM, PAN };

@Directive
({
  selector: 'three-3rd-person-control'
})
export class ThirdPersonControlDir implements OnChanges
{
  @Input() camera: ACamera<any>;
  @Input() player: AObject3D<any>;

  private playerObj: Object3D;
  private cameraObj: Camera;

  ngOnChanges( changes: SimpleChanges )
  {
    if ( this.camera && this.camera.camera && this.player && this.player.object )
    {
      this.cameraObj = this.camera.camera;
      this.playerObj = this.player.object;
    }
  }

  autoRotateSpeed = 0.1;
  autoRotate = false;
  minDistance = 0;
  maxDistance = Infinity;
  minPolarAngle = 0;
  maxPolarAngle = Math.PI;
  moveSpeed = 0.2;
  turnSpeed = 0.1;

  userZoom = true;
  userZoomSpeed = 1.0;

  userRotate = true;
  userRotateSpeed = 1.5;

  YAutoRotation = false;

  private phiDelta = 0;
  private thetaDelta = 0;
  private scale = 1;
  private EPS = 0.000001;
  private PIXELS_PER_ROUND = 1800;
  private lastPosition;

  getAutoRotationAngle()
  {
    return 2 * Math.PI / 60 / 60 * this.autoRotateSpeed;
  }
  getZoomScale()
  {
    return Math.pow( 0.95, this.userZoomSpeed );
  }
  rotateLeft( angle )
  {
    if ( angle === undefined )
      angle = this.getAutoRotationAngle();
    this.thetaDelta -= angle;
  }
  rotateRight( angle )
  {
    if ( angle === undefined )
      angle = this.getAutoRotationAngle();
    this.thetaDelta += angle;
  }
  rotateUp( angle )
  {
    if ( angle === undefined )
      angle = this.getAutoRotationAngle();
    this.phiDelta -= angle;

  }
  rotateDown( angle )
  {
    if ( angle === undefined )
      angle = this.getAutoRotationAngle();
    this.phiDelta += angle;

  }
  zoomIn ( zoomScale )
  {
    if ( zoomScale === undefined )
      zoomScale = this.getZoomScale();
    this.scale /= zoomScale;
  }
  zoomOut ( zoomScale )
  {
    if ( zoomScale === undefined )
      zoomScale = this.getZoomScale();
    this.scale *= zoomScale;
  }

  update()
  {
    if ( !this.lastPosition )
      this.lastPosition = new Vector3( this.playerObj.position.x, this.playerObj.position.y, this.playerObj.position.z );
    // this.center = this.player.position;
    // this.cameraObj.position.copy( this.playerObj.position.clone().add( new Vector3( 0, 2, -10 ) ) );

    const position = this.cameraObj.position;
    const offset = position.clone().sub( this.playerObj.position );

    // angle from z-axis around y-axis
    let theta = Math.atan2( offset.x, offset.z );

    // angle from y-axis
    let phi = Math.atan2( Math.sqrt( offset.x * offset.x + offset.z * offset.z ), offset.y );

    theta += this.thetaDelta;
    phi += this.phiDelta;

    // restrict phi to be between desired limits
    phi = Math.max( this.minPolarAngle, Math.min( this.maxPolarAngle, phi ) );

    // restrict phi to be between EPS and PI-EPS
    phi = Math.max( this.EPS, Math.min( Math.PI - this.EPS, phi ) );

    let radius = offset.length() * this.scale;

    radius = Math.max( this.minDistance, Math.min( this.maxDistance, radius ) );

    offset.x = radius * Math.sin( phi ) * Math.sin( theta );
    offset.y = radius * Math.cos( phi );
    offset.z = radius * Math.sin( phi ) * Math.cos( theta );

    if ( this.autoRotate ) {

      this.cameraObj.position.x += this.autoRotateSpeed *
        ( ( this.playerObj.position.x + 8 * Math.sin( this.playerObj.rotation.y ) ) - this.cameraObj.position.x );
      this.cameraObj.position.z += this.autoRotateSpeed *
        ( ( this.playerObj.position.z + 8 * Math.cos( this.playerObj.rotation.y ) ) - this.cameraObj.position.z );
    } else {
      this.cameraObj.position.copy( this.playerObj.position.clone().add( offset ) );

    }

    this.cameraObj.lookAt( this.playerObj.position );

    this.thetaDelta = 0;
    this.phiDelta = 0;
    this.scale = 1;



    // if ( state === STATE.NONE && playerIsMoving ) {

    //   this.autoRotate = true;

    // } else {

    //   this.autoRotate = false;

    // }

    // if ( lastPosition.distanceTo( this.playerObj.position) > 0 ) {


      // lastPosition.copy( this.playerObj.position );

    // } else if ( lastPosition.distanceTo( this.playerObj.position) === 0 ) {

    //   playerIsMoving = false;

    // }
  }

  private rotateStart = new Vector2();
  private rotateEnd = new Vector2();
  private rotateDelta = new Vector2();
  private state: STATE;

  @HostListener('document:mousedown', ['$event.button', '$event.clientX', '$event.clientY' ])
  mouseDown( button: number, x: number, y: number )
  {
    if ( button === 0 ) {

      this.state = STATE.ROTATE;
      this.rotateStart.set( x, y );
    } else if ( button === 1 ) {

      this.state = STATE.ZOOM;
      // this.zoomStart.set( x, y );
    }
  }

  @HostListener('document:mousemove', ['$event.clientX', '$event.clientY'])
  mouseMove( x: number, y: number )
  {
    // if ( scope.enabled === false ) return;


    if ( this.state === STATE.ROTATE ) {

      this.rotateEnd.set( x, y );
      this.rotateDelta.subVectors( this.rotateEnd, this.rotateStart );

      this.rotateLeft( 2 * Math.PI * this.rotateDelta.x / this.PIXELS_PER_ROUND * this.userRotateSpeed );
      this.rotateUp( 2 * Math.PI * this.rotateDelta.y / this.PIXELS_PER_ROUND * this.userRotateSpeed );

      this.rotateStart.copy( this.rotateEnd );

    }
    // else if ( this.state === STATE.ZOOM )
    // {
    //   zoomEnd.set( x, y );
    //   zoomDelta.subVectors( zoomEnd, zoomStart );
    //   if ( zoomDelta.y > 0 ) {
    //     scope.zoomIn();
    //   } else {
    //     scope.zoomOut();
    //   }
    //   zoomStart.copy( zoomEnd );
    // }
  }
}
