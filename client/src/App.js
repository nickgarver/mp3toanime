import React from 'react';
import FileUpload from './components/FileUpload';
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTwitter, faInstagram } from '@fortawesome/free-brands-svg-icons'
import { faDonate, faBug, faQuestionCircle } from '@fortawesome/free-solid-svg-icons'
const helpMsg = "Hello, welcome to Mp3 Anime!\n\nThis is a shitty app internetboy built \nto share audio on twitter.\n\nJust drop some audio, pick your gif, and hit upload.  When it's done you can download it, and share to twitter!\n\n(or whatever lol)";

const App = () => (
  <div className="App min-h-screen text-blue-200 d-flex align-items-center justify-content-center">
    <button help-msg={helpMsg} className="help-btn"><FontAwesomeIcon className="socials-icn" icon={faQuestionCircle} /></button>
    <FileUpload id="file-upload" />
    <footer>
      <div className="footer-info">
        <a data-tooltip="Home" href="/" >
          Mp3 Anime 2021 ©{' '}
        </a>
      </div>
      <div className="footer-socials">
        <a data-tooltip="Report Bug" href="https://github.com/nickgarver/mp3toanime/issues" target="_blank" rel="noopener noreferrer" ><FontAwesomeIcon className="socials-icn" icon={faBug} /></a>
        <a data-tooltip="Help keep this app running" href="https://www.buymeacoffee.com/internetboy" target="_blank" rel="noopener noreferrer" ><FontAwesomeIcon className="socials-icn" icon={faDonate} /></a>
        <a data-tooltip="Twitter" href="https://twitter.com/internetboy999" target="_blank" rel="noopener noreferrer" ><FontAwesomeIcon className="socials-icn" icon={faTwitter} /></a>
        <a data-tooltip="Instagram" href="https://instagram.com/internetboy" target="_blank" rel="noopener noreferrer" ><FontAwesomeIcon className="socials-icn" icon={faInstagram} /></a>
      </div>
    </footer>
  </div>
);

export default App;
