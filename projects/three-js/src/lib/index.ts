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

export * from './constants';
export * from './object-3d';
export * from './geometry';
export * from './material';
export * from './object';
export * from './renderer.com';
export * from './scene.dir';
export * from './camera';
export * from './control';
export * from './light';
export * from './helper';
