import { NgModule } from '@angular/core';
import './enable.js';
import { RendererCom } from './renderer.com';
import { SceneDir } from './scene.dir';
import { PerspectiveCameraDir } from './camera';
import { OrbitControlsDir, ThirdPersonControlDir } from './control';
import { LightMod } from './light';
import { BoxBufferGeometryDir } from './geometry';
import { MaterialMod } from './material';
import { ObjectMod } from './object';
import { HelperMod } from './helper';

@NgModule
({
  declarations:
  [
    RendererCom,
    SceneDir,
    PerspectiveCameraDir,
    ThirdPersonControlDir,
    OrbitControlsDir,
    BoxBufferGeometryDir,
  ],
  exports:
  [
    RendererCom,
    SceneDir,
    PerspectiveCameraDir,
    ThirdPersonControlDir,
    OrbitControlsDir,
    BoxBufferGeometryDir,

    LightMod,
    HelperMod,
    ObjectMod,
    MaterialMod,

  ]
})
export class ThreeJsMod { }

export * from './geometry';
export * from './material';
export * from './renderer.com';
export * from './object';
export * from './constants';
export * from './object-3d';
