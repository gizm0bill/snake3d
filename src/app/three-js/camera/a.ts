import { Camera } from 'three';

export abstract class ACamera<T extends Camera>
{
  object: T;
  abstract updateAspectRatio(aspect: number): void;
}
