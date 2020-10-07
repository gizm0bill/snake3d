import { Directive, AfterViewInit, Input, forwardRef } from '@angular/core';
import { SphereBufferGeometry } from 'three';
import { AGeometry } from './a';

@Directive
({
  selector: 'three-sphere-buffer-geometry',
  providers: [{ provide: AGeometry, useExisting: forwardRef( () => SphereBufferGeometryDir ) }]
})
export class SphereBufferGeometryDir extends AGeometry<SphereBufferGeometry> implements AfterViewInit
{
  @Input() radius = 1;
  @Input() widthSegments = 16;
  @Input() heightSegments = 16;
  ngAfterViewInit()
  {
    this._object = new SphereBufferGeometry
    (
      this.radius,
      this.widthSegments,
      this.heightSegments,
    );
  }
}

