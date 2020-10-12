import { Directive, AfterViewInit, forwardRef } from '@angular/core';
import { AmbientLight } from 'three';
import { ALight } from './a';
import { AObject3D } from '../object-3d';

@Directive
({
  selector: 'three-ambient-light',
  providers: [{ provide: AObject3D, useExisting: forwardRef( () => AmbientLightDir ) }]
})
export class AmbientLightDir extends ALight<AmbientLight> implements AfterViewInit
{
  ngAfterViewInit()
  {
    this._object = new AmbientLight( this.color, this.intensity );
    super.ngAfterViewInit();
  }
}
