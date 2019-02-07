import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainCom } from './main.com';
import { ThreeJsMod } from '../three-js';
import { RoutingMod } from './routing.mod';
import { BoxMaterialDir } from './box-material.dir';
import { TestCom } from './test.com';
import { SnakeCom } from './snake.com';
import { SnakeSegmentDir } from './snake';

@NgModule
({
  declarations:
  [
    MainCom,
    SnakeCom,
    SnakeSegmentDir,
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
