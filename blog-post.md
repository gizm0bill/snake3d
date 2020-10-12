# Title

## Three.js setup

### Renderer

Knowing that it's an Angular application we would prefer to use the view system the Angular way, having [three.js][1] entities as components, something like:
```html
  <renderer>
    <camera />
    <scene>
      <light />
      <mesh />
    </scene>
  </renderer>
```

So let's create the `RendererComponent` with a `canvas` element inside bound using `@ViewChild( 'canvas' ) canvasRef: ElementRef;` and two `ContentChildren` for the scene and the camera. After view init we create a [`WebGLRenderer`][2] object on the canvas and we can also add other properties like color and alpha from inputs

#### _`renderer.component.ts`_
```typescript
import { AfterViewInit, Component,  Input, ViewChild, ElementRef, ContentChild } from '@angular/core';
import { Color, WebGLRenderer } from 'three';
// We'll get to these in a second
import { SceneDirective } from './scene.directive';
import { AbstractCamera } from './abstract-camera';

@Component
( {
  selector: 'three-renderer',
  template: '<canvas #canvas></canvas>'
} )
export class RendererComponent
{
  @ViewChild( 'canvas' ) canvasReference: ElementRef;
  get canvas(): HTMLCanvasElement { return this.canvasReference.nativeElement; }

  @ContentChild( SceneDirective ) scene: SceneDirective
  @ContentChild( AbstractCamera ) camera: AbstractCamera<any>;

  @Input() color: string | number | Color = 0xffffff;
  @Input() alpha = 0;
  
  ngAfterViewInit()
  {
    this.renderer = new WebGLRenderer( { canvas: this.canvas, antialias: true, alpha: true } );
    this.renderer.setPixelRatio( devicePixelRatio );
    this.renderer.setClearColor( this.color, this.alpha );
    this.renderer.autoClear = true;
  }
  render() { this.renderer.render( this.scene.object, this.camera.object ); }
}

```
We also need a method that calls `render` on the renderer with the scene and camera but first we need to create some components for them as well. 

### Object3D

Looking at the three.js library, most objects extend [`Object3D`][3], and these two as well, so let's do the same thing in Angular.
Let's create an abstract generic wrapper class as base for the rest, keeping in mind that we could also add child objects.

#### _`abstract-object-3d.ts`_
```typescript
import { Directive, ContentChildren } from '@angular/core';
import { Object3D } from 'three';

@Directive()
export abstract class AbstractObject3D<T extends Object3D> implements AfterViewInit
{
  protected object: T;

  @ContentChildren( AbstractObject3D, { descendants: true } ) 
  childNodes: QueryList<AbstractObject3D<any>>;

  ngAfterViewInit()
  {
    if ( this.childNodes !== undefined && this.childNodes.length > 1 )
      this.object.add( ...this.childNodes
        // filter out self and unset objects
        .filter( node => node !== this && node.object !== undefined )
        .map( ( { object } ) => object ) );
  }
}
```

Now, we can implement our objects using this

## Scene

#### _`scene.directive.ts`_
```typescript
import { Directive, AfterViewInit, forwardRef } from '@angular/core';
import { Scene } from 'three';
import { AbstractObject3D } from './abstract-object-3d';

@Directive
( {
  selector: 'three-scene',
  // https://angular.io/guide/dependency-injection-navtree#find-a-parent-by-its-class-interface
  providers: [ { provide: AbstractObject3D, useExisting: forwardRef( () => SceneDirective ) } ]
} )
export class SceneDirective extends AbstractObject3D<Scene> implements AfterViewInit
{
  ngAfterViewInit()
  {
    this.object = new Scene;
    super.ngAfterViewInit();
  }
}
```
### Camera

The three.js [`Camera`][4] also extended from [`Object3D`][3] but it's also abstract so we could do the same to follow this pattern

#### _`abstract-camera.ts`_
```typescript
import { Camera } from 'three';
import { AbstractObject3D } from './abstract-object-3d';

export abstract class AbstractCamera<T extends Camera> extends AbstractObject3D<T>
{
  abstract updateAspectRatio( aspect: number ): void;
}
```
The concrete [`PerspectiveCamera`][5] implementation

#### _`perspective-camera.directive.ts`_
```typescript
import { Directive, Input, AfterViewInit, forwardRef } from '@angular/core';
import { PerspectiveCamera } from 'three';
import { ACamera } from './abstract-camera';

@Directive
( {
  selector: 'three-perspective-camera',
  providers: [ { provide: AbstractCamera, useExisting: forwardRef( () => PerspectiveCameraDirective ) } ]
} )
export class PerspectiveCameraDirective extends AbstractCamera<PerspectiveCamera> implements AfterViewInit
{
  // basic inputs to initialize the camera with
  @Input() fov: number;
  @Input() near: number;
  @Input() far: number;

  @Input() positionX: number;
  @Input() positionY: number;
  @Input() positionZ: number;

  ngAfterViewInit()
  {
    this.object = new PerspectiveCamera( this.fov, undefined, this.near, this.far );
    this.object.position.x = this.positionX;
    this.object.position.y = this.positionY;
    this.object.position.z = this.positionZ;
    this.object.updateProjectionMatrix();
  }
  updateAspectRatio( aspect: number )
  {
    this.object.aspect = aspect;
    this.object.updateProjectionMatrix();
  }
}
```

### Meshes

[Meshes][6] are created using a [geometries][7] and [materials][8], so we're going to create some simple abstract classes for both

#### _`abstract-geometry.ts`_
```typescript
import { Geometry, BufferGeometry } from 'three';

export abstract class AbstractGeometry<T extends Geometry|BufferGeometry>
{
  protected object: T;
}
```
#### _`abstract-material.ts`_
```typescript
import { Material } from 'three';

export abstract class AbstractMaterial<T extends Material>
{
  protected object: T;
}
```

and now some concrete implementations

#### _`sphere-buffer-geometry.directive.ts`_
```typescript
import { Directive, AfterViewInit, Input, forwardRef } from '@angular/core';
import { SphereBufferGeometry } from 'three';
import { AGeometry } from './abstract-geometry';

@Directive
( {
  selector: 'three-sphere-buffer-geometry',
  providers: [ { provide: AbstractGeometry, useExisting: forwardRef( () => SphereBufferGeometryDirective ) } ]
} )
export class SphereBufferGeometryDirective extends AbstractGeometry<SphereBufferGeometry> implements AfterViewInit
{
  // some inputs for the sake of example
  @Input() radius = 1;
  @Input() widthSegments = 16;
  @Input() heightSegments = 16;
  ngAfterViewInit()
  {
    this.object = new SphereBufferGeometry
    (
      this.radius,
      this.widthSegments,
      this.heightSegments,
    );
  }
}
```
#### _`standard-material.directive.ts`_
```typescript
import { Directive, AfterViewInit, Input, forwardRef } from '@angular/core';
import { MeshStandardMaterial, Color, Side, FrontSide } from 'three';
import { AbstractMaterial } from './abstract-material';

@Directive
( {
  selector: 'three-standard-material',
  providers: [ { provide: AMaterial, useExisting: forwardRef( () => MeshStandardMaterialDirective ) } ]
} )
export class MeshStandardMaterialDirective extends AbstractMaterial<MeshStandardMaterial> implements AfterViewInit
{
  @Input() color: Color = new Color( 0x000000 );
  @Input() side: Side = FrontSide;
  @Input() transparent = false;
  ngAfterViewInit()
  {
    this.object = new MeshStandardMaterial
    ( {
      color: this.color,
      side: this.side,
      transparent: this.transparent,
    } );
  }
}
```
And now we are ready to create the [Mesh][6] directive
#### _`mesh.directive.ts`_
```typescript
import { Directive, AfterViewInit, forwardRef, ContentChild, Input } from '@angular/core';
import { Mesh, MeshBasicMaterial, Vector3 } from 'three';
import { AbstractObject3D } from '../abstract-object-3d';
import { AbstractMaterial } from '../abstract-material';
import { AbstractGeometry } from '../abstract-geometry';

@Directive
( {
  selector: 'three-mesh',
  providers: [ { provide: AbstractObject3D, useExisting: forwardRef( () => MeshDirective ) } ]
} )
export class MeshDirective extends AbstractObject3D<Mesh> implements AfterViewInit
{
  @ContentChild( AbstractGeometry ) geometry: AGeometry<any>;
  @ContentChild( AbstractMaterial ) material: AMaterial<any>;
  ngAfterViewInit()
  {
    this.object = new Mesh
    (
      this.geometry.object,
      this.material && this.material.object || new MeshStandardMaterial( { color: 0x000000 } )
    );
    super.ngAfterViewInit();
  }
}

```
We can put all these into a library project (angular-three)

## Putting it all together

Let's create a component with the desired component/directive structure

#### _`some.component.html`_
```typescript
<three-renderer>
  <three-perspective-camera [fov]="60" [near]="1" [far]="1100" position=" 5, 5, -10 "></three-perspective-camera>
  <three-scene>
    <three-ambient-light [color]='#000000'></three-ambient-light>
    <three-point-light color='#FFFFFF' position=" 0, 50, 20 "></three-point-light>
    <three-sphere-buffer-geometry [radius]='5'></three-sphere-buffer-geometry>
    <three-lambert-material></three-lambert-material>
  </three-scene>
</three-renderer>
```

#### _`some.component.ts`_
```typescript
import { Component, AfterViewInit, ViewChild, NgZone } from '@angular/core';
import { RendererComponent } from 'angular-three';

@Component
( {
  selector: 'some-component',
  template: './some.component.html'
} )
export class SomeComponent implement AfterViewInit
{
  @ViewChild( RendererComponent ) renderer: RendererComponent;
  
  constructor( private readonly zone: NgZone ) {}
  
  ngAfterViewInit()
  {
    // might make a performance difference
    this.zone.runOutsideAngular( _ => 
    {
      animate = () =>
      {
        requestAnimationFrame( animate );
        this.renderer.render() );
      };
      animate();
    }
  }
} 
```

## Controls
[Three.js][1] currently has some types of controls implemented found under the examples in the build. We could also use these pretty simple like so:

#### _`orbit-controls.directive.ts`_
```typescript
import { Directive, Input, AfterViewInit, OnDestroy, ContentChild } from '@angular/core';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { AbstractCamera } from './abstract-camera';
import { RendererComponent } from './renderer.component';

@Directive( { selector: 'three-orbit-controls' } )
export class OrbitControlsDirective implements AfterViewInit, OnDestroy
{
  object: OrbitControls;

  @ContentChild( AbstractCamera ) camera: AbstractCamera<any>;
  @ContentChild( RendererComponent ) renderer: RendererComponent;
  
  @Input() rotateSpeed = 1.0;
  @Input() zoomSpeed = 1.2;

  ngAfterViewInit(): void
  {
    this.object = new OrbitControls( this.camera.object );
    this.object.rotateSpeed = this.rotateSpeed;
    this.object.zoomSpeed = this.zoomSpeed;
    this.object.addEventListener( 'change', this.renderer.render );
  }
  ngOnDestroy() { this.object.dispose(); }
}
```

And in the application component wrap everything inside:

```html
<three-orbit-controls>
  <three-renderer>
    <three-perspective-camera />
    ...
  </three-renderer>
</three-orbit-controls>
```


[1]: <https://threejs.org/docs/> "Three.js Documentation"
[2]: <https://threejs.org/docs/#api/en/renderers/WebGLRenderer> "WebGLRenderer - three.js documentation"
[3]: <https://threejs.org/docs/#api/en/core/Object3D> "Object3D - three.js documentation"
[4]: <https://threejs.org/docs/#api/en/cameras/Camera> "Camera - three.js documentation"
[5]: <https://threejs.org/docs/#api/en/cameras/PerspectiveCamera> "PerspectiveCamera - three.js documentation"
[6]: <https://threejs.org/docs/#api/en/objects/Mesh> "Mesh - three.js documentation"
[7]: <https://threejs.org/docs/#api/en/core/Geometry> "Geometry - three.js documentation"
[8]: <https://threejs.org/docs/#api/en/materials/Material> "Material - three.js documentation"
