import { NgModule } from '@angular/core';
import { AxesHelperDir } from './axes.dir';
import { GridHelperDir } from './grid.dir';

const exports =
[
  AxesHelperDir,
  GridHelperDir,
];
@NgModule
( {
  exports,
  declarations: exports,
} )
export class HelperMod {}

export * from './axes.dir';
export * from './grid.dir';
