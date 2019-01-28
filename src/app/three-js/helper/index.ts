import { NgModule } from '@angular/core';
import { AxesHelperDir } from './axes.dir';
import { GridHelperDir } from './grid.dir';
import { SkeletonHelperDir } from './skeleton.dir';

const exports =
[
  AxesHelperDir,
  GridHelperDir,
  SkeletonHelperDir,
];
@NgModule
({
  exports,
  declarations: exports,
})
export class HelperMod {}

export * from './axes.dir';
export * from './grid.dir';
export * from './skeleton.dir';