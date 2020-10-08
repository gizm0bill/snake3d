# Title

## Three.js setup

### Renderer

Knowing that it's an Angular application we would prefer to use the view system the Angular way, having three.js entities as components, something like:
```html
  <renderer>
    <camera />
    <scene>
      <light />
      <mesh />
    </scene>
  </renderer>
```

So let's create the `RendererComponent` with a `canvas` element inside bound using   `@ViewChild( 'canvas' ) canvasRef: ElementRef;` and two `ContentChildren` for the scene and the camera. After view init we create a `WebGLRenderer` object on the canvas and we can also add other properties like color and alpha from inputs

```typescript
@Input() color: string | number | Color = 0xffffff;
@Input() alpha = 0;

ngAfterViewInit()
{
  this.renderer = new WebGLRenderer( { canvas: this.canvas, antialias: true, alpha: true } );
  this.renderer.setPixelRatio( devicePixelRatio );
  this.renderer.setClearColor( this.color, this.alpha );
  this.renderer.autoClear = true;
}
```
We also need a method that calls `render` on the renderer with the scene and camera but first we need to create some components for them as well. 

Now, looking at the three.js library, most objects extend `Object3D`, and these 2 as well, so let's do the same thing in Angular.
Let's create an abstract generic wrapper class as base for the rest, keeping in mind that we could also add child objects.

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
