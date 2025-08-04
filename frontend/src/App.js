import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material';
import Chat from './components/Chat';
import Header from './components/Header';
import './App.css';

const theme = createTheme({
  typography: {
    fontFamily: 'Roboto Slab, serif',
    allVariants: {
      color: 'white'
    }
  },
  palette: {
    mode: 'dark',
    primary: {
      main: '#00fffc'
    }
  }
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        <Header />
        <Chat />
      </div>
    </ThemeProvider>
  );
}

export default App;
