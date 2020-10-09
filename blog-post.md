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

#### _`object-3d.ts`_
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

[1]: <https://threejs.org/docs/> "Three.js Documentation"
[2]: <https://threejs.org/docs/#api/en/renderers/WebGLRenderer> "WebGLRenderer - three.js documentation"
[3]: <https://threejs.org/docs/#api/en/core/Object3D> "Object3D - three.js documentation"
[4]: <https://threejs.org/docs/#api/en/cameras/Camera> "Camera - three.js documentation"
[5]: <https://threejs.org/docs/#api/en/cameras/PerspectiveCamera> "PerspectiveCamera - three.js documentation"
