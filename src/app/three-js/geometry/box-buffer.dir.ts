import { Directive, AfterViewInit, Input, forwardRef } from '@angular/core';
import { BoxBufferGeometry, CylinderBufferGeometry } from 'three';
import { AGeometry } from './a';

@Directive
({
  selector: 'three-box-buffer-geometry',
  providers: [{ provide: AGeometry, useExisting: forwardRef( () => BoxBufferGeometryDir ) }]
})
export class BoxBufferGeometryDir extends AGeometry<BoxBufferGeometry> implements AfterViewInit
{
  @Input() width = 128;
  @Input() height = 128;
  @Input() depth = 128;
  @Input() widthSegments = 1;
  @Input() heightSegments = 1;
  @Input() depthSegments = 1;
  ngAfterViewInit()
  {
    this._object = new BoxBufferGeometry
    (
      this.width,
      this.height,
      this.depth,
      this.widthSegments,
      this.heightSegments,
      this.depthSegments
    );
  }
}

