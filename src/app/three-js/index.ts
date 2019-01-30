import { NgModule } from '@angular/core';
import './enable.js';
import { RendererCom } from './renderer.com';
import { SceneDir } from './scene.dir';
import { PerspectiveCameraDir } from './camera';
import { OrbitControlsDir, ThirdPersonControlDir, TrackballControlsDir } from './control';
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
    TrackballControlsDir,
    BoxBufferGeometryDir,
  ],
  exports:
  [
    RendererCom,
    SceneDir,
    PerspectiveCameraDir,
    ThirdPersonControlDir,
    OrbitControlsDir,
    TrackballControlsDir,
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
