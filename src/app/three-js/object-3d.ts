import { AfterViewInit, Input, QueryList, ContentChildren } from '@angular/core';
import { Object3D, Vector3, Euler } from 'three';

const typeCheckVectorSetter = function( what: string, value: any )
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
  this[what] = new Vector3( x, y, z );
};

export abstract class AObject3D<T extends Object3D> implements AfterViewInit
{
  @ContentChildren( AObject3D, { descendants: true } ) childNodes: QueryList<AObject3D<any>>;

  private _position: Vector3 = new Vector3( 0, 0, 0 );
  get position(): Vector3 { return this._position; }
  private _setPosition = typeCheckVectorSetter.bind( this, '_position' );
  @Input() set position( value: Vector3 ) { this._setPosition(value); }

  private _scale: Vector3 = new Vector3( 0, 0, 0 );
  get scale(): Vector3 { return this._scale; }
  private _setScale = typeCheckVectorSetter.bind( this, '_scale' );
  @Input() set scale( value: Vector3 ) { this._setScale(value); }

  private _rotation: Euler = new Euler( 0, 0, 0, 'XYZ' );
  get rotation(): (number|string)[] & Euler { return this._rotation as any; }
  @Input() set rotation( [ x, y, z, order ]: (number|string)[] & Euler )
  {
    this._rotation = new Euler( x as number, y as number, z as number, order as string );
  }



  protected _object: T;
  get object(): T { return this._object; }

  protected addChild(object: Object3D): T { return this._object.add(object); }

  ngAfterViewInit(): void
  {
    this.object.position.copy( this.position );
    this.object.rotation.copy( this.rotation );

    if ( this.childNodes !== undefined && this.childNodes.length > 1 )
      this.childNodes.filter( i => i !== this && i.object !== undefined )
        .forEach( i =>  this.addChild( i.object ) );
    this.childNodes.changes.subscribe( _ => { debugger; } )
  }
}
