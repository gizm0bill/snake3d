import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThreeJsMod } from 'three-js';
import { MainCom } from './main.com';
import { RoutingMod } from './routing.mod';
import { SnakeCom } from './snake.com';
import { SnakeSegmentDir } from './snake';
import { AppleCom } from './apple.com';
import { BoxCom } from './box.com';

@NgModule
({
  declarations:
  [
    MainCom,
    AppleCom,
    SnakeCom,
    SnakeSegmentDir,
    BoxCom,
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
