import
{
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  HostListener,
  ContentChildren,
  QueryList, Input
} from '@angular/core';
import { SceneDir } from './scene.dir';
import { PerspectiveCameraDir } from './camera';
import { Color, WebGLRenderer } from 'three';

@Component
( {
  selector: 'three-renderer',
  template: '<canvas #canvas width="0" height="0"></canvas>',
  styles: [ 'canvas { width: 100%; height: 100%; }' ]
} )
export class RendererCom implements AfterViewInit
{
  constructor() { this.render = this.render.bind(this); }

  private renderer: WebGLRenderer;

  @Input() color: string | number | Color = 0xffffff;
  @Input() alpha = 0;

  @ViewChild('canvas', { static: true }) canvasRef: ElementRef;
  get canvas(): HTMLCanvasElement { return this.canvasRef.nativeElement; }

  @ContentChildren(SceneDir) sceneComponents: QueryList<SceneDir>;
  @ContentChildren(PerspectiveCameraDir) cameraComponents: QueryList<PerspectiveCameraDir>;

  ngAfterViewInit()
  {
    this.renderer = new WebGLRenderer( { canvas: this.canvas, antialias: true, alpha: true } );
    this.renderer.setPixelRatio(devicePixelRatio);
    // this.renderer.shadowMap.enabled = true;
    // this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.setClearColor( this.color, this.alpha );
    this.renderer.autoClear = true;
    this.onResize(new Event('_dummy_'));
  }

  get domElement() { return this.renderer.domElement; }
  render()
  {
    const sceneComponent = this.sceneComponents.first;
    const cameraComponent = this.cameraComponents.first;
    this.renderer.render(sceneComponent.object, cameraComponent.object);
  }

  private calculateAspectRatio(): number
  {
    const height = this.canvas.clientHeight - 4;
    if (height === 0) {
      return 0;
    }
    return (this.canvas.clientWidth - 4) / (this.canvas.clientHeight - 4);
  }

  @HostListener('window:resize', ['$event'])
  onResize( event: Event )
  {
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    // console.log('RendererComponent.onResize: ' + this.canvas.clientWidth + ', ' + this.canvas.clientHeight);

    this.updateChildCamerasAspectRatio();

    this.renderer.setSize(this.canvas.clientWidth - 4, this.canvas.clientHeight - 4);
    this.render();
  }

  updateChildCamerasAspectRatio()
  {
    const aspect = this.calculateAspectRatio();
    this.cameraComponents.forEach(camera => camera.updateAspectRatio(aspect));
  }
}
