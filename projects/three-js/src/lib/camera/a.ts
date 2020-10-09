import { Directive } from '@angular/core';
import { Camera } from 'three';
import { AObject3D } from '../object-3d';

@Directive()
export abstract class ACamera<T extends Camera> extends AObject3D<T>
{
  abstract updateAspectRatio(aspect: number): void;
}
