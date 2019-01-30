import { Directive, Input, AfterViewInit, OnDestroy, ContentChildren, QueryList } from '@angular/core';
import * as THREE from 'three';
import { PerspectiveCameraDir } from '../camera';
import { RendererCom } from '../renderer.com';
import 'three/examples/js/controls/TrackballControls';

@Directive
({
  selector: 'three-trackball-control'
})
export class TrackballControlsDir implements AfterViewInit, OnDestroy
{
  @ContentChildren(PerspectiveCameraDir, { descendants: true }) childCameras: QueryList<PerspectiveCameraDir>;
  @ContentChildren(RendererCom, { descendants: true }) childRenderers: QueryList<RendererCom>;

  controls: THREE.TrackballControls;

  constructor() {
    console.log('TrackballControlsDir.constructor');
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

    this.controls = new THREE.TrackballControls(this.childCameras.first.camera);
    this.controls.addEventListener('change', this.childRenderers.first.render);
    this.childRenderers.first.render();
  }

  ngOnDestroy() { this.controls.dispose(); }

}
