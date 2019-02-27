import { Vector3, Quaternion } from 'three';

export const [ vZero, vX, vY, vZ ] = [ new Vector3( 0, 0, 0 ), new Vector3( 1, 0, 0 ), new Vector3( 0, 1, 0 ), new Vector3( 0, 0, 1 ) ];
export const [ quatZero ] = [ new Quaternion ];
export const [ deg90, deg81, deg180, deg270, deg360 ] = [ Math.PI / 2, Math.PI / 2 * 9 / 8.1, Math.PI, Math.PI * 1.5, 2 * Math.PI ];
