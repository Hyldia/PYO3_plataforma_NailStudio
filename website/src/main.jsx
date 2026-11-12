import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { CarritoProvider } from './context/CarritoContext.jsx';
import { ReservaProvider } from './context/ReservaContext.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <CarritoProvider>
        <ReservaProvider>
          <App />
        </ReservaProvider>
      </CarritoProvider>
    </BrowserRouter>
  </React.StrictMode>
);
