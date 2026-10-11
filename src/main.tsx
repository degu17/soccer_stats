import { render } from 'preact';
import { App } from './app';
import './styles.css';
import './screens.css';

// Keep the layout pinned: block pinch-zoom and pull-to-refresh gestures on mobile browsers.
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener(
  'touchmove',
  (e) => {
    if (e.touches.length > 1) e.preventDefault();
  },
  { passive: false },
);

render(<App />, document.getElementById('app')!);
