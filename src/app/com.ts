import { Component } from '@angular/core';
import { environment } from '../environments/environment';

@Component
( {
  selector: 'app-root',
  template: '<router-outlet></router-outlet>',
} )
export class AppCom
{
  constructor() {
    if ( environment.showSourceDomain )
      console.log( '%cWant to see the app\'s source? Head over to https://dev.snake.gzm.me and... you know what to do ;)',
        `background-color: rgba(0, 0, 0, 0.4); font-size: 1rem; padding: .5rem 1rem; color: white;` );
  }
}
