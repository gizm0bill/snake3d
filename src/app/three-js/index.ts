import { NgModule } from '@angular/core';
import './enable.js';
import { RendererCom } from './renderer.com';
import { SceneDir } from './scene.dir';
import { PerspectiveCameraDir } from './camera';
import { OrbitControlsDir } from './control';
import { PointLightDir } from './light';
import { AxesHelperDir, GridHelperDir } from './helper';
import { BoxBufferGeometryDir } from './geometry';
import { MeshDir } from './mesh.dir';

@NgModule
({
  declarations:
  [
    RendererCom,
    SceneDir,
    PerspectiveCameraDir,
    OrbitControlsDir,
    PointLightDir,
    AxesHelperDir,
    GridHelperDir,
    MeshDir,
    BoxBufferGeometryDir,
  ],
  exports:
  [
    RendererCom,
    SceneDir,
    PerspectiveCameraDir,
    OrbitControlsDir,
    PointLightDir,
    AxesHelperDir,
    GridHelperDir,
    MeshDir,
    BoxBufferGeometryDir,
  ]
})
export class ThreeJsMod { }

export * from './geometry';
export * from './material';
export * from './renderer.com';
