import React, { Suspense, lazy } from 'react';
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTwitter, faInstagram } from '@fortawesome/free-brands-svg-icons'
import { faDonate, faQuestionCircle } from '@fortawesome/free-solid-svg-icons'
const FileUpload = lazy(() => import('./components/FileUpload'));
const helpMsg = "Hello, welcome to Mp3 Anime!\n\nThis is an app internetboy built \nto share audio on twitter.\n\nJust drop some audio, pick your gif, \nand hit upload.  When it's done you\ncan download it and share to twitter!\n\n Enjoy!\n @internetboy";
const renderLoader = () => (
  <div className="lds-ellipsis">
    <div></div><div></div>
    <div></div><div></div>
  </div>
);

const App = () => (
  <div className="App min-h-screen text-blue-200 d-flex align-items-center justify-content-center">
    <img id="poweredby" src={process.env.PUBLIC_URL + '/Poweredby_640px-Black_VertLogo.png'} alt="powered by giphy" />
    <button aria-label="help button" help-msg={helpMsg} className="help-btn"><FontAwesomeIcon className="socials-icn" icon={faQuestionCircle} /></button>
    <Suspense fallback={renderLoader()}>
      <FileUpload id="file-upload" />
    </Suspense>
    <footer>
      <div className="footer-info">
        <a data-tooltip="Home" href="/" >
          MP3 Anime 2021 ©{' '}
        </a>
      </div>
      <div className="footer-socials">
        <a aria-label="Donate" data-tooltip="Help keep this app running" href="https://www.buymeacoffee.com/internetboy" target="_blank" rel="noopener noreferrer" ><FontAwesomeIcon className="socials-icn" icon={faDonate} /></a>
        <a aria-label="Twitter" data-tooltip="Twitter" href="https://twitter.com/internetboy999" target="_blank" rel="noopener noreferrer" ><FontAwesomeIcon className="socials-icn" icon={faTwitter} /></a>
        <a aria-label="Instagram" data-tooltip="Instagram" href="https://instagram.com/internetboy" target="_blank" rel="noopener noreferrer" ><FontAwesomeIcon className="socials-icn" icon={faInstagram} /></a>
      </div>
    </footer>
  </div>
);

export default App;
