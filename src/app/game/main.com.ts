import { Component, ViewChild, NgZone, OnDestroy, AfterViewInit, HostListener } from '@angular/core';
import { RendererCom } from '../three-js';

@Component
({
  selector: 'acme-dehydrated-boulders',
  templateUrl: './main.com.pug',
  styleUrls: ['./main.com.scss'],
})

export class MainCom implements OnDestroy, AfterViewInit
{
  @ViewChild(RendererCom) childRenderer: RendererCom;

  private refreshInterval: any;
  constructor( private readonly zone: NgZone )
  {
  }

  private renderer: any;
  @HostListener( 'window:resize', ['$event'] )
  onWindowResize( event: any ) {
    debugger;
    this.renderer.onResize( event );
  }

  ngOnDestroy()
  {
  }

  ngAfterViewInit()
  {
    this.renderer = this.childRenderer;
    // setTimeout( this.renderer.onResize.bind(renderer), 500 ); // TODO: animation end from unloaded component
    // this.zone.runOutsideAngular( () =>
    //   this.refreshInterval = setInterval( () =>
    //   {
    //     this.renderer.render();
    //   }, 29) );
  }
}
