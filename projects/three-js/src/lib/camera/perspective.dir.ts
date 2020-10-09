import { Directive, Input, forwardRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { ACamera } from './a';
import { PerspectiveCamera } from 'three';

@Directive
({
  selector: 'three-perspective-camera',
  exportAs: 'threePerspectiveCamera',
  providers: [{ provide: ACamera, useExisting: forwardRef(() => PerspectiveCameraDir) }]
})
export class PerspectiveCameraDir extends ACamera<PerspectiveCamera> implements AfterViewInit, OnChanges
{
  _object: PerspectiveCamera;

  @Input() fov: number;
  @Input() near: number;
  @Input() far: number;

  @Input() positionX: number;
  @Input() positionY: number;
  @Input() positionZ: number;

  ngAfterViewInit(): void
  {
    this.object = new PerspectiveCamera( this.fov, undefined, this.near, this.far );
    // Set position and look at
    this.object.position.x = this.positionX;
    this.object.position.y = this.positionY;
    this.object.position.z = this.positionZ;
    this.object.updateProjectionMatrix();

  }
  updateAspectRatio(aspect: number)
  {
    this.object.aspect = aspect;
    this.object.updateProjectionMatrix();
  }

  ngOnChanges( changes: SimpleChanges )
  {
    if ( changes.fov && changes.fov.currentValue && !changes.fov.firstChange )
    {
      this.object.fov = changes.fov.currentValue;
      this.object.updateProjectionMatrix();
    }
  }
}
