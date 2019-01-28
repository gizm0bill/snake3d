import { AfterViewInit, Input, Directive, forwardRef } from '@angular/core';
import * as THREE from 'three';
import { AMaterial, MeshLambertMaterialDir } from '../three-js';

@Directive
({
  selector: 'game-box-material',
  providers: [ { provide: AMaterial, useExisting: forwardRef( () => BoxMaterialDir ) } ],
})
export class BoxMaterialDir extends MeshLambertMaterialDir implements AfterViewInit
{
  @Input() color = new THREE.Color(0xff00ff);
  @Input() side = THREE.BackSide;
}
