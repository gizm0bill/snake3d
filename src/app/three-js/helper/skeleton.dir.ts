import
{
  forwardRef,
  Input,
  Directive,
  AfterViewInit,
} from '@angular/core';
import { SkeletonHelper, LineBasicMaterial } from 'three';
import { AObject3D } from '../object-3d';
import { SkinnedMeshDir } from '../object/skinned-mesh.dir';

@Directive
({
  selector: 'three-skeleton-helper',
  providers: [{ provide: AObject3D, useExisting: forwardRef( () => SkeletonHelperDir ) }]
})
export class SkeletonHelperDir extends AObject3D<SkeletonHelper> implements AfterViewInit
{
  @Input() mesh: SkinnedMeshDir;
  ngAfterViewInit()
  {
    this._object = new SkeletonHelper( this.mesh.object );
    super.ngAfterViewInit();
  }
}
