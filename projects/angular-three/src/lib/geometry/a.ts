import { Geometry, BufferGeometry } from 'three';

export abstract class AGeometry<T extends Geometry|BufferGeometry>
{
  protected _object: T;
  get object(): T { return this._object; }
  set object( value: T ) { this._object = value; }
}
