import { NgModule } from '@angular/core';
import { RendererCom } from './renderer.com';
import { SceneDir } from './scene.dir';
import { LightMod } from './light';
import { MaterialMod } from './material';
import { ObjectMod } from './object';
import { HelperMod } from './helper';
import { CameraMod } from './camera';
import { GeometryMod } from './geometry';
import { ControlMod } from './control';

import * as THREE from 'three';

@NgModule
( {
  declarations:
  [
    RendererCom,
    SceneDir,
  ],
  exports:
  [
    RendererCom,
    SceneDir,
    CameraMod,
    GeometryMod,
    LightMod,
    HelperMod,
    ObjectMod,
    MaterialMod,
    ControlMod,
  ]
} )
export class AngularThreeMod { }

export { vZero, vX, vY, vZ, quatZero, deg90, deg180, deg270, deg360 } from './constants';
export { AObject3D } from './object-3d';
export { GeometryMod, BoxBufferGeometryDir, SphereBufferGeometryDir } from './geometry';
export { MaterialMod, MeshBasicMaterialDir, MeshLambertMaterialDir, MeshPhongMaterialDir, MeshStandardMaterialDir } from './material';
export { ObjectMod, MeshDir, GroupDir, LineDir, LineSegmentsDir } from './object';
export { RendererCom } from './renderer.com';
export { SceneDir } from './scene.dir';
export { CameraMod, ACamera, PerspectiveCameraDir } from './camera';
export { ControlMod, OrbitControlsDir } from './control';
export { LightMod, ALight, AmbientLightDir, PointLightDir } from './light';
export { HelperMod, AxesHelperDir, GridHelperDir } from './helper';
