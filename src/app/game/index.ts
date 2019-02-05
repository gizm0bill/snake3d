import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainCom } from './main.com';
import { ThreeJsMod } from '../three-js';
import { RoutingMod } from './routing.mod';
import { BoxMaterialDir } from './box-material.dir';
import { TestCom } from './test.com';

@NgModule
({
  declarations:
  [
    MainCom,
    TestCom,
    BoxMaterialDir,
  ],
  imports:
  [
    CommonModule,
    ThreeJsMod,
    RoutingMod,
  ],
  providers: [  ],
})
export class GameMod {}
