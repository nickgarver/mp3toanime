import React from 'react';
import FileUpload from './components/FileUpload';
import './App.css';
import { faPaypal, faTwitter, faInstagram } from '@fortawesome/free-brands-svg-icons'
import { faDonate } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const App = () => (
  <div className="App min-h-screen text-blue-200 d-flex align-items-center justify-content-center">
    <FileUpload id="file-upload" />
    <footer>
      <div className="footer-info">
        <a data-tooltip="Source code" href="https://github.com/nickgarver" target="_blank" rel="noopener noreferrer" >
          Mp3 Anime 2021 ©{' '}
        </a>
      </div>
      <div className="footer-socials">
        <a data-tooltip="Help keep this app running" href="https://www.buymeacoffee.com/internetboy" ><FontAwesomeIcon className="socials-icn" icon={faDonate} /></a>
        <a data-tooltip="Twitter" href="https://twitter.com/internetboy999" ><FontAwesomeIcon className="socials-icn" icon={faTwitter} /></a>
        <a data-tooltip="Instagram" href="https://instagram.com/internetboy" ><FontAwesomeIcon className="socials-icn" icon={faInstagram} /></a>
      </div>
    </footer>
  </div>
);

export default App;
