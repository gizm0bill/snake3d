import { Directive, AfterViewInit, Input, forwardRef } from '@angular/core';
import { MeshLambertMaterial, Color, FrontSide, Side } from 'three';
import { AMaterial } from './a';

@Directive
({
  selector: 'three-lambert-material',
  providers: [{ provide: AMaterial, useExisting: forwardRef( () => MeshLambertMaterialDir ) }]
})
export class MeshLambertMaterialDir extends AMaterial<MeshLambertMaterial> implements AfterViewInit
{
  @Input() color: Color = new Color( 0x0000FF );
  @Input() side: Side = FrontSide;
  @Input() skinning = false;
  @Input() wireframe = false;

  ngAfterViewInit()
  {
    this._object = new MeshLambertMaterial
    ({
      color: this.color,
      skinning: !!this.skinning,
      side: this.side,
      wireframe: !!this.wireframe,
    });
  }
}

