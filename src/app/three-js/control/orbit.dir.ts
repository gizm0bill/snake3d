import { Directive, Input, AfterViewInit, OnDestroy, ContentChildren, QueryList } from '@angular/core';
import { PerspectiveCameraDir } from '../camera';
import { RendererCom } from '../renderer.com';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/js/controls/OrbitControls';

@Directive
( {
  selector: 'three-orbit-controls'
} )
export class OrbitControlsDir implements AfterViewInit, OnDestroy
{

  @ContentChildren(PerspectiveCameraDir, { descendants: true }) childCameras: QueryList<PerspectiveCameraDir>;
  @ContentChildren(RendererCom, { descendants: true }) childRenderers: QueryList<RendererCom>;

  @Input() rotateSpeed = 1.0;
  @Input() zoomSpeed = 1.2;

  controls: OrbitControls;

  constructor() {
    console.log('OrbitControlsDir.constructor');
  }

  ngAfterViewInit(): void
  {
    console.log('OrbitControlsDir.ngAfterViewInit');
    if (this.childCameras === undefined || this.childCameras.first === undefined) {
      throw new Error('Camera is not found');
    }
    if (this.childRenderers === undefined || this.childRenderers.first === undefined) {
      throw new Error('Renderer is not found');
    }

    this.controls = new OrbitControls(this.childCameras.first.camera);
    this.controls.rotateSpeed = this.rotateSpeed;
    this.controls.zoomSpeed = this.zoomSpeed;
    this.controls.addEventListener('change', this.childRenderers.first.render);
    this.childRenderers.first.render();
  }

  ngOnDestroy() { this.controls.dispose(); }

}
