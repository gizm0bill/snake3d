import { Directive, AfterViewInit, Input, forwardRef } from '@angular/core';
import { Color, MeshBasicMaterial } from 'three';
import { AMaterial } from '../a';

@Directive
({
  selector: 'three-mesh-basic-material',
  providers: [{ provide: AMaterial, useExisting: forwardRef( () => MeshBasicMaterialDir ) }]
})
export class MeshBasicMaterialDir extends AMaterial<MeshBasicMaterial> implements AfterViewInit
{
  @Input() color: THREE.Color = new Color( 0x0000FF );
  ngAfterViewInit()
  {
    this._object = new MeshBasicMaterial
    ({
      color: this.color,
    });
  }
}

