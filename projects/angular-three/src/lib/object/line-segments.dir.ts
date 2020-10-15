import { Directive, AfterViewInit, forwardRef, ContentChild } from '@angular/core';
import { LineBasicMaterial, LineSegments } from 'three';
import { AObject3D } from '../object-3d';
import { AMaterial } from '../material';
import { AGeometry } from '../geometry';

@Directive
({
  selector: 'three-line-segments',
  providers: [ { provide: AObject3D, useExisting: forwardRef( () => LineSegmentsDir ) } ]
})
export class LineSegmentsDir extends AObject3D<LineSegments> implements AfterViewInit
{
  @ContentChild( AGeometry, { static: true } ) geometry: AGeometry<any>;
  @ContentChild( AMaterial, { static: true } ) material: AMaterial<any>;
  ngAfterViewInit()
  {
    this._object = new LineSegments
    (
      this.geometry.object,
      this.material && this.material.object || new LineBasicMaterial( { color: 0x000000 } )
    );
    super.ngAfterViewInit();
  }
}
