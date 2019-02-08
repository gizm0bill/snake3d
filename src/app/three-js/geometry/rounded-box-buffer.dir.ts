import { Directive, AfterViewInit, Input, forwardRef } from '@angular/core';
import { BufferGeometry, BufferAttribute, Vector3 } from 'three';
import { AGeometry } from './a';
import { deg90 } from '../constants';

export class RoundedBoxBufferGeometry extends BufferGeometry
{
  parameters: any;
  constructor( width: number, height: number, depth: number, radius: number, radiusSegments: number )
  {
    super();
    this.type = 'RoundedBoxBufferGeometry';
    radiusSegments = !isNaN( radiusSegments ) ? Math.max( 1, Math.floor( radiusSegments ) ) : 1 ;
    width =  !isNaN(width) ? width  : 1;
    height = !isNaN(height) ? height : 1;
    depth =  !isNaN(depth) ? depth  : 1;
    radius = !isNaN(radius) ? radius : .15;
    radius = Math.min( radius , Math.min( width , Math.min( height , Math.min( depth ) ) ) / 2 );
    this.parameters = { width, height, depth, radius, radiusSegments };
    const
      edgeHalfWidth =  width / 2 - radius,
      edgeHalfHeight = height / 2 - radius,
      edgeHalfDepth =  depth / 2 - radius,
      rs1 =  radiusSegments + 1,
      totalVertexCount = ( rs1 * radiusSegments + 1 ) * 3,
      positions = new BufferAttribute( new Float32Array( totalVertexCount * 3 ), 3 ),
      normals = new BufferAttribute( new Float32Array( totalVertexCount * 3 ), 3 );
    const
      cornerVerts = Array(8).fill([]),
      cornerNormals = Array(8).fill([]),
      vertex = new Vector3(),
      vertexPool = [],
      normalPool = [],
      indices = [],
      lastVertex = rs1 * radiusSegments,
      cornerVertNumber = rs1 * radiusSegments + 1;

    doVertices();
    doFaces();
    doCorners();
    doHeightEdges();
    doWidthEdges();
    doDepthEdges();

    function doVertices()
    {
      debugger;
      const cornerLayout =
      [
        new Vector3(  1 ,  1 ,  1 ),
        new Vector3(  1 ,  1 , -1 ),
        new Vector3( -1 ,  1 , -1 ),
        new Vector3( -1 ,  1 ,  1 ),
        new Vector3(  1 , -1 ,  1 ),
        new Vector3(  1 , -1 , -1 ),
        new Vector3( -1 , -1 , -1 ),
        new Vector3( -1 , -1 ,  1 )
      ];
      // construct 1/8 sphere
      const cornerOffset = new Vector3( edgeHalfWidth , edgeHalfHeight , edgeHalfDepth );

      for ( let y = 0; y <= radiusSegments; y++ )
      {
        const
          v = y / radiusSegments,
          va = v * deg90, // arrange in 90 deg
          cosVa = Math.cos( va ), // scale of vertical angle
          sinVa = Math.sin( va );

        if ( y === radiusSegments )
        {
          vertex.set( 0, 1, 0 );
          const vert = vertex.clone().multiplyScalar( radius ).add( cornerOffset );
          cornerVerts[0].push( vert );
          vertexPool.push( vert );
          const norm = vertex.clone();
          cornerNormals[0].push( norm );
          normalPool.push( norm );
          continue; // skip row loop
        }
        for ( let x = 0; x <= radiusSegments; x++ )
        {

          const
            u = x / radiusSegments,
            ha = u * deg90;
          // make 1/8 sphere points
          vertex.x = cosVa * Math.cos( ha );
          vertex.y = sinVa;
          vertex.z = cosVa * Math.sin( ha );
          // copy sphere point, scale by radius, offset by half whd
          const vert = vertex.clone().multiplyScalar( radius ).add( cornerOffset );
          cornerVerts[0].push( vert );
          vertexPool.push( vert );
          // sphere already normalized, just clone
          const norm = vertex.clone().normalize();
          cornerNormals[0].push( norm );
          normalPool.push( norm );
        }
      }
      // distribute corner verts
      for ( let i = 1 ; i < 8 ; i++ )
      {
        for ( let j = 0 ; j < cornerVerts[0].length ; j++ )
        {
          const vert = cornerVerts[0][j].clone().multiply( cornerLayout[i] );
          cornerVerts[i].push( vert );
          vertexPool.push( vert );
          const norm = cornerNormals[0][j].clone().multiply( cornerLayout[i] );
          cornerNormals[i].push( norm );
          normalPool.push( norm );
        }
      }
    }
    // weave corners
    function doCorners()
    {
      const
        flips = [ true, false, true, false, false, true, false, true ],
        lastRowOffset = rs1 * ( radiusSegments - 1 );
      for ( let i = 0 ; i < 8 ; i ++ )
      {
        const cornerOffset = cornerVertNumber * i;
        for ( let v = 0 ; v < radiusSegments - 1 ; v ++ )
        {
          const
            r1 = v * rs1, 		// row offset
            r2 = (v + 1) * rs1; // next row
          for ( let u = 0 ; u < radiusSegments ; u ++ )
          {
            const u1 = u + 1,
              [ a, b, c, d ] =
              [ cornerOffset + r1 + u, cornerOffset + r1 + u1, cornerOffset + r2 + u, cornerOffset + r2 + u1 ];

            if ( !flips[i] )
              indices.push( a, b, c, b, d, c );
            else
              indices.push( a, c, b, b, c, d );
          }
        }
        for ( let u = 0 ; u < radiusSegments ; u ++ )
        {
          const [ a, b, c ] =
            [ cornerOffset + lastRowOffset + u, cornerOffset + lastRowOffset + u + 1, cornerOffset + lastVertex ];

          if ( !flips[i] )
            indices.push( a, b, c );
          else
            indices.push( a, c, b );
        }
      }
    }
    // plates
    // fix this loop matrices find pattern something
    function doFaces()
    {
      // top
      let [ a, b, c, d ] =
      [
        lastVertex,
        lastVertex + cornerVertNumber,
        lastVertex + cornerVertNumber * 2,
        lastVertex + cornerVertNumber * 3
      ];
      indices.push( a, b, c, a, c, d );

      // bottom
      [ a, b, c, d ] =
      [
        lastVertex + cornerVertNumber * 4,
        lastVertex + cornerVertNumber * 5,
        lastVertex + cornerVertNumber * 6,
        lastVertex + cornerVertNumber * 7
      ];
      indices.push( a, c, b, a, d, c );

      // left
      [ a, b, c, d ] =
      [
        0,
        cornerVertNumber,
        cornerVertNumber * 4,
        cornerVertNumber * 5
      ];
      indices.push( a, c, b, b, c, d );

      // right
      [ a, b, c, d ] =
      [
        cornerVertNumber * 2,
        cornerVertNumber * 3,
        cornerVertNumber * 6,
        cornerVertNumber * 7
      ];
      indices.push( a, c, b, b, c, d );

      // front
      [ a, b, c, d] =
      [
        radiusSegments,
        radiusSegments + cornerVertNumber * 3,
        radiusSegments + cornerVertNumber * 4,
        radiusSegments + cornerVertNumber * 7,
      ];
      indices.push( a, b, c, b, d, c );

      // back
      [ a, b, c, d ] =
      [
        radiusSegments + cornerVertNumber,
        radiusSegments + cornerVertNumber * 2,
        radiusSegments + cornerVertNumber * 5,
        radiusSegments + cornerVertNumber * 6
      ];
      indices.push( a, c, b, b, c, d );
    }
    // weave edges
    function doHeightEdges()
    {
      for ( let i = 0 ; i < 4 ; i++ )
      {
        const
          cOffset = i * cornerVertNumber,
          cRowOffset = 4 * cornerVertNumber + cOffset,
          needsFlip = i % 2;

        for ( let u = 0 ; u < radiusSegments ; u++ )
        {
          const u1 = u + 1,
            [ a, b, c, d ] =
            [
              cOffset + u,
              cOffset + u1,
              cRowOffset + u,
              cRowOffset + u1
            ];
          if ( !needsFlip )
            indices.push( a, b, c, b, d, c );
          else
            indices.push( a, c, b, b, c, d );
        }
      }
    }

    function doDepthEdges()
    {
      const
        cStarts = [ 0 , 2 , 4 , 6 ],
        cEnds =   [ 1 , 3 , 5 , 7 ];
      for ( let i = 0 ; i < 4 ; i ++ )
      {
        const
          [ cStart, cEnd ] = [ cornerVertNumber * cStarts[ i ], cornerVertNumber * cEnds[ i ] ],
          needsFlip = 1 >= i;

        for ( let u = 0 ; u < radiusSegments ; u ++ )
        {
          const
            urs1 =  u * rs1,
            u1rs1 = ( u + 1 ) * rs1,
            [ a, b, c, d ] =
            [
              cStart + urs1,
              cStart + u1rs1,
              cEnd + urs1,
              cEnd + u1rs1
            ];
          if ( needsFlip )
            indices.push( a, c, b, b, c, d );
          else
            indices.push( a, b, c, b, d, c );
        }
      }
    }

    function doWidthEdges()
    {
      const end = radiusSegments - 1,
        cStarts = [ 0 , 1 , 4 , 5 ],
        cEnds =   [ 3 , 2 , 7 , 6 ],
        needsFlip = [ 0, 1, 1, 0 ];

      for ( let i = 0 ; i < 4 ; i ++ )
      {
        const
          cStart = cStarts[i] * cornerVertNumber,
          cEnd = cEnds[i] * cornerVertNumber;

          for ( let u = 0 ; u <= end ; u ++ )
          {
            const [ a, b, c, d ] =
            [
              cStart + radiusSegments + u * rs1,
              cStart + ( u !== end ? radiusSegments + (u + 1) * rs1 : cornerVertNumber - 1),
              cEnd + radiusSegments + u * rs1,
              cEnd + ( u !== end ? radiusSegments + (u + 1) * rs1 : cornerVertNumber - 1)
            ];
          if ( !needsFlip[i] )
            indices.push( a, b, c, b, d, c );
          else
            indices.push( a, c, b, b, c, d );
        }
      }
    }
    // fill buffers
    let index = 0;
    for ( let i = 0 ; i < vertexPool.length ; i ++ )
    {
      positions.setXYZ( index, vertexPool[i].x, vertexPool[i].y, vertexPool[i].z );
      normals.setXYZ( index, normalPool[i].x, normalPool[i].y, normalPool[i].z );
      index++;
    }
    this.setIndex( new BufferAttribute( new Uint16Array( indices ) , 1 ) );
    this.addAttribute( 'position', positions );
    this.addAttribute( 'normal', normals );
  }
}

@Directive
({
  selector: 'three-rounded-box-buffer-geometry',
  providers: [{ provide: AGeometry, useExisting: forwardRef( () => RoundedBoxBufferGeometryDir ) }]
})
export class RoundedBoxBufferGeometryDir extends AGeometry<RoundedBoxBufferGeometry> implements AfterViewInit
{
  @Input() width = 128;
  @Input() height = 128;
  @Input() depth = 128;
  @Input() radius = 8;
  @Input() radiusSegments = 4;
  ngAfterViewInit()
  {
    this._object = new RoundedBoxBufferGeometry
    (
      this.width,
      this.height,
      this.depth,
      this.radius,
      this.radiusSegments,
    );
  }
}

