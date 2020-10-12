import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularThreeMod } from 'angular-three';
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
    AngularThreeMod,
    RoutingMod,
  ],
  providers: [  ],
})
export class GameMod {}
