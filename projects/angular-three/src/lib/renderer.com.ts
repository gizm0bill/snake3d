import
{
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  HostListener,
  Input,
  ContentChild
} from '@angular/core';
import { SceneDir } from './scene.dir';
import { ACamera } from './camera';
import { Color, WebGLRenderer } from 'three';

@Component
( {
  selector: 'three-renderer',
  template: '<canvas #canvas width="0" height="0"></canvas>',
  styles: [ ':host { display: block; height: 100%; }', 'canvas { width: 100%; height: 100%; }' ]
} )
export class RendererCom implements AfterViewInit
{
  constructor() { this.render = this.render.bind(this); }

  renderer: WebGLRenderer;

  @Input() color: string | number | Color = 0xffffff;
  @Input() alpha = 1;

  @ViewChild('canvas', { static: true }) canvasRef: ElementRef;
  get canvas(): HTMLCanvasElement { return this.canvasRef.nativeElement; }

  // @ContentChildren(SceneDir) sceneComponents: QueryList<SceneDir>;
  // @ContentChildren(ACamera) cameraComponents: QueryList<ACamera<any>>;
  @ContentChild( SceneDir ) scene: SceneDir;
  @ContentChild( ACamera ) camera: ACamera<any>;

  ngAfterViewInit()
  {
    this.renderer = new WebGLRenderer( { canvas: this.canvas, antialias: true, alpha: true } );
    this.renderer.setPixelRatio(devicePixelRatio);
    // this.renderer.shadowMap.enabled = true;
    // this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.setClearColor( this.color, this.alpha );
    this.renderer.autoClear = true;
    this.onResize( new Event( '_dummy_' ) );
  }

  get domElement() { return this.renderer.domElement; }
  render()
  {
    this.renderer.render( this.scene.object, this.camera.object );
  }

  private calculateAspectRatio(): number
  {
    if ( this.canvas.clientHeight === 0 ) return 0;
    return this.canvas.clientWidth / this.canvas.clientHeight;
  }

  @HostListener('window:resize', ['$event'])
  onResize( event: Event )
  {
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.updateCameraAspectRatio();
    this.renderer.setSize( this.canvas.clientWidth, this.canvas.clientHeight );
    this.render();
  }

  updateCameraAspectRatio()
  {
    const aspect = this.calculateAspectRatio();
    this.camera.updateAspectRatio( aspect );
  }
}
