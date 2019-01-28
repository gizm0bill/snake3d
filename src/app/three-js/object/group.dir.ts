import
{
  forwardRef,
  Directive,
  ContentChildren,
  QueryList,
  AfterViewInit,
} from '@angular/core';
import { Group } from 'three';
import { MeshDir } from './mesh.dir';
import { AObject3D } from '../object-3d';

@Directive
({
  selector: 'three-group',
  providers: [{ provide: AObject3D, useExisting: forwardRef( () => GroupDir ) }]
})
export class GroupDir extends AObject3D<Group> implements AfterViewInit
{
  @ContentChildren(MeshDir) meshes: QueryList<MeshDir>;

  ngAfterViewInit()
  {
    this._object = new Group;
    this.meshes.changes.subscribe( _ =>
      this.meshes.forEach( mesh => !this.object.children.includes( mesh.object ) && this.object.add( mesh.object ) ) );
    return !!this.meshes.length && this.object.add( ...this.meshes.map( mesh => mesh.object ) );
  }
}
