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
  camera: PerspectiveCamera;

  @Input() fov: number;
  @Input() near: number;
  @Input() far: number;

  @Input() positionX: number;
  @Input() positionY: number;
  @Input() positionZ: number;

  ngAfterViewInit(): void
  {
    this.camera = new PerspectiveCamera( this.fov, undefined, this.near, this.far );
    // Set position and look at
    this.camera.position.x = this.positionX;
    this.camera.position.y = this.positionY;
    this.camera.position.z = this.positionZ;
    this.camera.updateProjectionMatrix();

  }
  updateAspectRatio(aspect: number)
  {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  ngOnChanges( changes: SimpleChanges )
  {
    if ( changes.fov && changes.fov.currentValue && !changes.fov.firstChange )
    {
      this.camera.fov = changes.fov.currentValue;
      this.camera.updateProjectionMatrix();
    }
  }
}
