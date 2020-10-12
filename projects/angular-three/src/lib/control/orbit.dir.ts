import { Directive, Input, AfterViewInit, OnDestroy, ContentChild } from '@angular/core';
import { ACamera } from '../camera';
import { RendererCom } from '../renderer.com';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

@Directive
( {
  selector: 'three-orbit-controls'
} )
export class OrbitControlsDir implements AfterViewInit, OnDestroy
{
  object: OrbitControls;

  @ContentChild( ACamera ) camera: ACamera<any>;
  @ContentChild( RendererCom ) renderer: RendererCom;

  @Input() rotateSpeed = 1.0;
  @Input() zoomSpeed = 1.2;

  ngAfterViewInit(): void
  {
    this.object = new OrbitControls( this.camera.object, this.renderer.domElement );
    this.object.rotateSpeed = this.rotateSpeed;
    this.object.zoomSpeed = this.zoomSpeed;
    this.object.addEventListener( 'change', this.renderer.render );
    // this.childRenderers.first.render();
  }

  ngOnDestroy() { this.object.dispose(); }

}
