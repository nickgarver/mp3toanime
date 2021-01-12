import React from 'react';
import FileUpload from './components/FileUpload';
import './App.css';

const App = () => (
  <div  className="App min-h-screen text-blue-200 d-flex align-items-center justify-content-center">
      <FileUpload id="file-upload" />
  </div>
);

export default App;
