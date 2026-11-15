import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { CarritoProvider } from './context/CarritoContext.jsx';
import { ReservaProvider } from './context/ReservaContext.jsx';
// Tipografías incluidas en el proyecto (no dependen de Google Fonts)
import '@fontsource/great-vibes/400.css';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/nunito-sans/400.css';
import '@fontsource/nunito-sans/600.css';
import '@fontsource/nunito-sans/700.css';
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
