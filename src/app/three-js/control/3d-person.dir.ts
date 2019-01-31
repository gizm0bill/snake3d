import { Directive, Input, OnChanges, HostListener } from '@angular/core';
import { ACamera } from '../camera';
import { AObject3D } from '../object-3d';
import { Object3D, Camera, Vector3, Vector2, Quaternion, Spherical } from 'three';

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
  ngOnChanges()
  {
    if ( this.camera && this.camera.camera )
    {
      this.cameraObj = this.camera.camera;
      this.quat = (new Quaternion).setFromUnitVectors( this.cameraObj.up, new Vector3( 0, 1, 0 ) );
      this.quatInverse = this.quat.clone().inverse();
    }
    if ( this.player && this.player.object ) this.playerObj = this.player.object;
  }

  minDistance = 0;
  maxDistance = Infinity;

  // How far you can orbit vertically, upper and lower limits.
  // Range is 0 to Math.PI radians.
  minPolarAngle = - Infinity; // radians
  maxPolarAngle = Math.PI; // radians

  // How far you can orbit horizontally, upper and lower limits.
  // If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
  minAzimuthAngle = - Infinity; // radians
  maxAzimuthAngle = Infinity; // radians

  // Set to true to enable damping (inertia)
  // If damping is enabled, you must call controls.update() in your animation loop
  enableDamping = true;
  dampingFactor = 1.25;

  // This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
  // Set to false to disable zooming
  enableZoom = true;
  zoomSpeed = 1;

  // Set to false to disable rotating
  enableRotate = true;
  rotateSpeed = .25;

  private scale = 1;
  private spherical = new Spherical;
  private sphericalDelta = new Spherical;
  private quat: Quaternion;
  private quatInverse: Quaternion;
  private offset = new Vector3;
  private lastPosition = new Vector3;
  private lastQuaternion = new Quaternion;
  update()
  {
    if ( !this.cameraObj || !this.playerObj ) return false;
    this.offset.copy( this.cameraObj.position );
    // rotate offset to "y-axis-is-up" space
    this.offset.applyQuaternion( this.quat );
    // angle from z-axis around y-axis
    this.spherical.setFromVector3( this.offset );

    // if ( scope.autoRotate && state === STATE.NONE ) {

    //   rotateLeft( getAutoRotationAngle() );

    // }

    this.spherical.theta += this.sphericalDelta.theta;
    this.spherical.phi += this.sphericalDelta.phi;
    // restrict theta to be between desired limits
    this.spherical.theta = Math.max( this.minAzimuthAngle, Math.min( this.maxAzimuthAngle, this.spherical.theta ) );
    // restrict phi to be between desired limits
    this.spherical.phi = Math.max( this.minPolarAngle, Math.min( this.maxPolarAngle, this.spherical.phi ) );
    this.spherical.makeSafe();
    this.spherical.radius *= this.scale;
    // restrict radius to be between desired limits
    this.spherical.radius = Math.max( this.minDistance, Math.min( this.maxDistance, this.spherical.radius ) );
    this.offset.setFromSpherical( this.spherical );

    // rotate offset back to "camera-up-vector-is-up" space
    this.offset.applyQuaternion( this.quatInverse );

    this.cameraObj.position.copy( this.offset );
    this.cameraObj.lookAt( this.playerObj.position );

    if ( this.enableDamping === true ) {

      this.sphericalDelta.theta *= ( 1 - this.dampingFactor );
      this.sphericalDelta.phi *= ( 1 - this.dampingFactor );
    } else this.sphericalDelta.set( 0, 0, 0 );
    this.scale = 1;
    // update condition is:
    // min(camera displacement, camera rotation in radians)^2 > EPS
    // using small-angle approximation cos(x/2) = 1 - x^2 / 8
    if ( this.lastPosition.distanceToSquared( this.cameraObj.position ) > .000001 ||
      8 * ( 1 - this.lastQuaternion.dot( this.cameraObj.quaternion ) ) > .000001 )
    {
      this.lastPosition.copy( this.cameraObj.position );
      this.lastQuaternion.copy( this.cameraObj.quaternion );
    }
  }

  rotateStartEvent: MouseEvent;
  private _mouseLocked = false;
  set mouseLocked( value: boolean )
  {
    if ( !!value )
    {
      this.rotateStart.set( this.rotateStartEvent.clientX, this.rotateStartEvent.clientY );
      this.rotateStartEvent = undefined;
    }
    this._mouseLocked = value;
  }
  get mouseLocked() { return this._mouseLocked; }

  private rotateStart = new Vector2();
  private rotateEnd = new Vector2();
  private rotateDelta = new Vector2();

  private get zoomScale() { return Math.pow( 0.95, this.zoomSpeed ); }
  private rotateLeft( angle: number ) { this.sphericalDelta.theta -= angle; }
  private rotateUp( angle: number ) { this.sphericalDelta.phi -= angle; }
  private dollyIn( dollyScale: number ) { this.scale /= dollyScale; }
  private dollyOut( dollyScale: number ) { this.scale *= dollyScale; }

  @HostListener('document:mousemove', ['$event.clientX', '$event.clientY', '$event.target.clientHeight'])
  mouseMove( x: number, y: number, elementHeight: number )
  {
    if ( !this.mouseLocked ) return;
    this.rotateEnd.set( x, y );
    this.rotateDelta.subVectors( this.rotateEnd, this.rotateStart ).multiplyScalar( this.rotateSpeed );
    this.rotateLeft( 2 * Math.PI * this.rotateDelta.x / elementHeight ); // yes, height
    this.rotateUp( 2 * Math.PI * this.rotateDelta.y / elementHeight );
    this.rotateStart.copy( this.rotateEnd );
    this.update();
  }

  @HostListener('document:mousewheel', ['$event.deltaX', '$event.deltaY'])
  mouseWheel( x: number, y: number )
  {
    if ( y < 0 ) this.dollyOut( this.zoomScale );
    else if ( y > 0 ) this.dollyIn( this.zoomScale );
    this.update();
  }

}
