import { ChangeDetectionStrategy, Component, forwardRef, ViewChild } from '@angular/core';
import { AObject3D, SphereBufferGeometryDir, MeshDir, MeshPhongMaterialDir } from '../three-js';

@Component
({
  selector: 'game-apple',
  template: `
    <three-sphere-buffer-geometry></three-sphere-buffer-geometry>
    <three-mesh-phong-material></three-mesh-phong-material>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: AObject3D, useExisting: forwardRef( () => AppleCom ) }]
})
export class AppleCom extends MeshDir
{
  @ViewChild(SphereBufferGeometryDir) geometry: SphereBufferGeometryDir;
  @ViewChild(MeshPhongMaterialDir) material: MeshPhongMaterialDir;
}
