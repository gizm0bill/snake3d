import { Input, AfterViewInit, Directive } from '@angular/core';
import { Color, Light } from 'three';
import { AObject3D } from '../object-3d';

@Directive()
export abstract class ALight<T extends Light> extends AObject3D<T> implements AfterViewInit
{
  @Input() color: Color;
  @Input() intensity: number;
  ngAfterViewInit() { super.ngAfterViewInit(); }
}
