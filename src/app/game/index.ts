import { NgModule } from '@angular/core';
import { MainCom } from './main.com';
import { ThreeJsMod } from '../three-js';
import { RoutingMod } from './routing.mod';
import { BoxMaterialDir } from './box-material.dir';

// import { CustomShaderMaterialDir } from './custom-shader.dir';

@NgModule
({
  declarations:
  [
    MainCom,
    BoxMaterialDir
  ],
  imports:
  [
    // SharedMod,
    ThreeJsMod,
    RoutingMod,
  ],
  providers: [  ],
})
export class GameMod {}
