import { Directive, Input, AfterViewInit, OnDestroy, ContentChildren, QueryList } from '@angular/core';
import { PerspectiveCameraDir } from '../camera';
import { RendererCom } from '../renderer.com';
import 'three/examples/js/controls/TrackballControls';
import { TrackballControls } from 'three';

@Directive
({
  selector: 'three-trackball-controls'
})
export class TrackballControlsDir implements AfterViewInit, OnDestroy
{

  @ContentChildren(PerspectiveCameraDir, { descendants: true }) childCameras: QueryList<PerspectiveCameraDir>;
  @ContentChildren(RendererCom, { descendants: true }) childRenderers: QueryList<RendererCom>;

  @Input() rotateSpeed = 1.0;
  @Input() zoomSpeed = 1.2;

  controls: TrackballControls;

  constructor() {
    console.log('OrbitControlsDir.constructor');
  }

  ngAfterViewInit(): void
  {
    if (this.childCameras === undefined || this.childCameras.first === undefined) {
      throw new Error('Camera is not found');
    }
    if (this.childRenderers === undefined || this.childRenderers.first === undefined) {
      throw new Error('Renderer is not found');
    }

    this.controls = new TrackballControls( this.childCameras.first.camera);
    this.controls.rotateSpeed = this.rotateSpeed;
    this.controls.zoomSpeed = this.zoomSpeed;
    this.controls.addEventListener('change', this.childRenderers.first.render);
    this.childRenderers.first.render();
  }

  ngOnDestroy() { this.controls.dispose(); }

}
