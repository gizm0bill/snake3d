import { AfterViewInit, Input, Directive, forwardRef } from '@angular/core';
import * as THREE from 'three';
import { AMaterial } from '../three-js';

@Directive
({
  selector: 'game-box-material',
  providers: [ { provide: AMaterial, useExisting: forwardRef( () => BoxMaterialDir ) } ],
})
export class BoxMaterialDir extends AMaterial<THREE.MeshBasicMaterial> implements AfterViewInit
{
  @Input() color = 0xff00ff;
  ngAfterViewInit()
  {
    this._object = new THREE.MeshBasicMaterial({ color: this.color, side: THREE.BackSide });
  }
}
