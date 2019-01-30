import { Camera } from 'three';

export abstract class ACamera<T extends Camera>
{
  camera: T;
  abstract updateAspectRatio(aspect: number): void;
}
