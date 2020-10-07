import { Directive, AfterViewInit, forwardRef } from '@angular/core';
import { Scene } from 'three';
import { AObject3D } from './object-3d';

@Directive
({
  selector: 'three-scene',
  providers: [{ provide: AObject3D, useExisting: forwardRef(() => SceneDir) }]
})
export class SceneDir extends AObject3D<Scene> implements AfterViewInit
{
  ngAfterViewInit()
  {
    this._object = new Scene;
    super.ngAfterViewInit();
    // setTimeout( () => console.log(this._object), 5000 );
  }
}
