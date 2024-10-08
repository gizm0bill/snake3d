import { Directive, Input, AfterViewInit, forwardRef } from '@angular/core';
import { Color, GridHelper } from 'three';
import { AObject3D } from '../object-3d';

@Directive
({
  selector: 'three-grid-helper',
  providers: [{ provide: AObject3D, useExisting: forwardRef( () => GridHelperDir ) }]
})
export class GridHelperDir extends AObject3D<GridHelper> implements AfterViewInit
{
  @Input() size: number;
  @Input() divisions: number;
  @Input() color: Color;

  ngAfterViewInit()
  {
    this._object = new GridHelper(this.size, this.divisions, undefined, this.color || new Color(0xeeeeee));
    super.ngAfterViewInit();
  }
}
