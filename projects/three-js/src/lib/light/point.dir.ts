import { Directive, Input, AfterViewInit, forwardRef } from '@angular/core';
import { PointLight } from 'three';
import { ALight } from './a';
import { AObject3D } from '../object-3d';

@Directive
({
  selector: 'three-point-light',
  providers: [{ provide: AObject3D, useExisting: forwardRef(() => PointLightDir) }]
})
export class PointLightDir extends ALight<PointLight> implements AfterViewInit
{
  @Input() distance: number;
  ngAfterViewInit()
  {
    this._object = new PointLight(this.color, this.intensity, this.distance);
    super.ngAfterViewInit();
  }
}
