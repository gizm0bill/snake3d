import { Directive, AfterViewInit, Input, forwardRef } from '@angular/core';
import { Color, FrontSide, MeshStandardMaterial, Side } from 'three';
import { AMaterial } from '../a';

@Directive
({
  selector: 'three-mesh-standard-material',
  providers: [{ provide: AMaterial, useExisting: forwardRef( () => MeshStandardMaterialDir ) }]
})
export class MeshStandardMaterialDir extends AMaterial<MeshStandardMaterial> implements AfterViewInit
{
  @Input() color: Color = new Color( 0xAA0000 );
  @Input() side: Side = FrontSide;
  ngAfterViewInit()
  {
    this._object = new MeshStandardMaterial
    ({
      color: this.color,
      side: this.side,
    });
  }
}

