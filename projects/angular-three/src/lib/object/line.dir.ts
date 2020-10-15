import { Directive, AfterViewInit, forwardRef, ContentChild, Input } from '@angular/core';
import { Line, LineBasicMaterial } from 'three';
import { AObject3D } from '../object-3d';
import { AMaterial } from '../material';
import { AGeometry } from '../geometry';

@Directive
({
  selector: 'three-line',
  providers: [ { provide: AObject3D, useExisting: forwardRef( () => LineDir ) }]
})
export class LineDir extends AObject3D<Line> implements AfterViewInit
{
  @ContentChild( AGeometry, { static: true } ) geometry: AGeometry<any>;
  @ContentChild( AMaterial, { static: true } ) material: AMaterial<any>;
  ngAfterViewInit()
  {
    this._object = new Line
    (
      this.geometry.object,
      this.material && this.material.object || new LineBasicMaterial( { color: 0x000000 } )
    );
    super.ngAfterViewInit();
  }
}
