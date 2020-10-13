# Snake

## Game scene

Thinking about this in a natural way let's create a scene with our snake and an apple:

```html
<three-renderer>
  <three-perspective-camera… />
  <three-scene>
    ...
    <game-snake />
    <game-apple />
    ... 
  </three-scene>
</three-renderer>
```

We can create a unique game loop, limited to 60 fps using RxJS, from which we can branch out other streams, and can share with the other components through standard Angular inputs.

```typescript
import { timer, animationFrameScheduler } from 'rxjs';
import { scan, share } from 'rxjs/operators';
...
this.snakeSpeed = 1000; // speed in ms
this.loop$ = timer( 0, 1000 / 60, animationFrameScheduler ).pipe
(
  scan<any, { time: number, delta: number }>( previous =>
  {
    const time = performance.now();
    return { time, delta: time - previous.time };
  }, { time: performance.now(), delta: 0 } ),
  share()
)
```
```html
  <game-snake [loop]="loop$" [speed]="snakeSpeed">
```

Now inside the snake component we can branch it to a "keyframe loop", marking each step the snake should advance to a new position depending on its speed. Basically just setting a future time marker on the current loop and advancing it forward when the current time passes it, subtracting the frame delta difference

```typescript
this.keyFrameLoop$ = this.loop.pipe
(
  scan<{ time: number, futureTime: number, delta: number }, { futureTime: number }>( ( previous, current ) =>
  {
    current.futureTime = previous.futureTime;
    if ( current.time > previous.futureTime  ) // mark key frame
    {
      const deltaTime = current.time - current.futureTime;
      if ( deltaTime > this.speed ) // simple drop mitigation
      {
        current.delta = 16.66;
        current.futureTime = current.time + current.delta;
      }
      else
      {
        current.delta = current.time - current.futureTime;
        current.futureTime += this.speed - deltaTime;
      }
    }
    return current;
  }, { futureTime: performance.now() + this.speed } ),
  share(),
);
```

Directions, we can implement these with a component `HostListener` and a `BehaviorSubject`, so each time we press a key it will send a new value to the subject.

```typescript
export enum DirectionCommand { UP = 1, DOWN = 2 , LEFT = 3, RIGHT = 4 }
...
private direction$ = new BehaviorSubject<DirectionCommand>( null );
@HostListener('document:keydown.w')
private directionUp() { this.direction$.next( DirectionCommand.UP ); }
@HostListener('document:keydown.a')
private directionLeft() { this.direction$.next( DirectionCommand.LEFT ); }
@HostListener('document:keydown.s')
private directionDown() { this.direction$.next( DirectionCommand.DOWN ); }
@HostListener('document:keydown.d')
private directionRight() { this.direction$.next( DirectionCommand.RIGHT ); }
```
But we also need the direction to emit its value once and then reset back, because we're going to hold it until the next key frame but we need to distinguish this moment

```typescript
const keyFrameDirection$ = combineLatest
( [ 
  this.keyFrameLoop$, 
  this.direction$.pipe( switchMap( direction => of( current, null ) ) ) // emit once and reset to null
] ).pipe
(
  scan( ( [ previous, nextDirection ], [ current, currentDirection ] ) =>
  {
    if ( previous.futureTime !== current.futureTime )
    {
      // if ( nextDirection ) store this and use it later on the snake segments
      return [ current, null ]; // reset next direction
    }
    nextDirection = nextDirection || currentDirection; // capture direction change and propagate to next frames
    return [ current, nextDirection ]; // send the current time info and next direction to the accumulator
  }),
  share(),
);
```
