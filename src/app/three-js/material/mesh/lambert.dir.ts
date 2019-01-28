import { Directive, AfterViewInit, Input, forwardRef } from '@angular/core';
import { MeshLambertMaterial, Color, FrontSide } from 'three';
import { AMaterial } from '../a';

@Directive
({
  selector: 'three-mesh-lambert-material',
  providers: [{ provide: AMaterial, useExisting: forwardRef( () => MeshLambertMaterialDir ) }]
})
export class MeshLambertMaterialDir extends AMaterial<MeshLambertMaterial> implements AfterViewInit
{
  @Input() color: THREE.Color = new Color( 0x0000FF );
  @Input() side: THREE.Side = FrontSide;
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

