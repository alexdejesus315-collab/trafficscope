import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { PADDLE_CLIENT_TOKEN, PADDLE_ENVIRONMENT } from './lib/paddleConfig';


declare global {
  interface Window {
    Paddle: any;
  }
}

if (window.Paddle) {
  window.Paddle.Environment.set(PADDLE_ENVIRONMENT);
  window.Paddle.Initialize({ token: PADDLE_CLIENT_TOKEN });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
