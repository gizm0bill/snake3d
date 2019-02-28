import { Directive, AfterViewInit, Input, forwardRef } from '@angular/core';
import { MeshPhongMaterial, Color, FrontSide } from 'three';
import { AMaterial } from '../a';

@Directive
({
  selector: 'three-mesh-phong-material',
  providers: [{ provide: AMaterial, useExisting: forwardRef( () => MeshPhongMaterialDir ) }]
})
export class MeshPhongMaterialDir extends AMaterial<MeshPhongMaterial> implements AfterViewInit
{
  @Input() color: THREE.Color = new Color( 0xAA0000 );
  ngAfterViewInit()
  {
    this._object = new MeshPhongMaterial
    ({
      color: this.color,
    });
  }
}

