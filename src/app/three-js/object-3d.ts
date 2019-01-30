import { AfterViewInit, Input, QueryList, ContentChildren } from '@angular/core';
import * as THREE from 'three';
import { Vector3, Euler } from 'three';

export abstract class AObject3D<T extends THREE.Object3D> implements AfterViewInit
{
  @ContentChildren( AObject3D, { descendants: false } ) childNodes: QueryList<AObject3D<any>>;

  private _position: Vector3 = new Vector3( 0, 0, 0 );
  get position(): Vector3 { return this._position; }
  @Input() set position( value: Vector3 )
  {
    let [ x, y, z ] = [ 0, 0, 0 ];
    switch ( true )
    {
      case value instanceof Vector3:
        [ x, y, z ] = value.toArray();
        break;
      case typeof value === 'string':
        [ x, y, z ] = (value as unknown as string).split(',').map( v => +v );
        break;
      case Array.isArray(value):
        [ x, y, z ] = value as unknown as number[];
        break;
    }
    this._position = new Vector3( x, y, z );
  }

  private _rotation: Euler = new Euler( 0, 0, 0, 'XYZ' );
  get rotation(): (number|string)[] & Euler { return this._rotation as any; }
  @Input() set rotation( [ x, y, z, order ]: (number|string)[] & Euler )
  {
    this._rotation = new Euler( x as number, y as number, z as number, order as string );
  };

  protected _object: T;
  get object(): T { return this._object; }

  ngAfterViewInit(): void
  {
    this.object.position.copy( this.position );
    this.object.rotation.copy( this.rotation );

    if ( this.childNodes !== undefined && this.childNodes.length > 1 )
      this.childNodes.filter( i => i !== this && i.object !== undefined )
        .forEach( i =>  this.addChild(i.object) );
  }
  protected addChild(object: THREE.Object3D): any
  {
    return this._object.add(object);
  }
}
