import { Directive, AfterViewInit, Input, forwardRef } from '@angular/core';
import { MeshLambertMaterial, Color, FrontSide, Side } from 'three';
import { AMaterial } from './a';

@Directive
({
  selector: 'three-lambert-material',
  providers: [ { provide: AMaterial, useExisting: forwardRef( () => MeshLambertMaterialDir ) } ]
})
export class MeshLambertMaterialDir extends AMaterial<MeshLambertMaterial> implements AfterViewInit
{
  @Input() color: Color = new Color( 0xFF0000 );
  @Input() transparent = false;
  @Input() opacity = 1;
  @Input() side: Side = FrontSide;
  @Input() wireframe = false;

  ngAfterViewInit()
  {
    this._object = new MeshLambertMaterial
    ( {
      color: this.color,
      transparent: !!this.transparent,
      opacity: this.opacity,
      side: this.side,
      wireframe: !!this.wireframe,
    } );
  }
}

