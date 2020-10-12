import { Directive, Input, AfterViewInit, forwardRef } from '@angular/core';
import { AxesHelper } from 'three';
import { AObject3D } from '../object-3d';

@Directive
({
  selector: 'three-axes-helper',
  providers: [{ provide: AObject3D, useExisting: forwardRef(() => AxesHelperDir) }]
})
export class AxesHelperDir extends AObject3D<AxesHelper> implements AfterViewInit
{
  @Input() size: number;

  ngAfterViewInit()
  {
    this._object = new AxesHelper(this.size);
    super.ngAfterViewInit();
  }
}
