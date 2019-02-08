import { NgModule } from '@angular/core';
import './enable.js';
import { RendererCom } from './renderer.com';
import { SceneDir } from './scene.dir';
import { LightMod } from './light';
import { MaterialMod } from './material';
import { ObjectMod } from './object';
import { HelperMod } from './helper';
import { CameraMod } from './camera';
import { GeometryMod } from './geometry';
import { ControlMod } from './control';

@NgModule
({
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
})
export class ThreeJsMod { }

export * from './geometry';
export * from './material';
export * from './renderer.com';
export * from './object';
export * from './constants';
export * from './object-3d';
