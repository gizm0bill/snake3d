import { Directive, AfterViewInit, Input, forwardRef } from '@angular/core';
import { MeshPhongMaterial, Color } from 'three';
import { AMaterial } from './a';

@Directive
({
  selector: 'three-phong-material',
  providers: [{ provide: AMaterial, useExisting: forwardRef( () => MeshPhongMaterialDir ) }]
})
export class MeshPhongMaterialDir extends AMaterial<MeshPhongMaterial> implements AfterViewInit
{
  @Input() color: Color = new Color( 0xAA0000 );
  ngAfterViewInit()
  {
    this._object = new MeshPhongMaterial
    ({
      color: this.color,
    });
  }
}

