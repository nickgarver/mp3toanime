import React, { Fragment, useState, useLayoutEffect } from 'react';
import Progress from './Progress';
import { useDropzone } from "react-dropzone"
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGrinSquintTears, faArrowUp, faArrowDown, faCompactDisc, faRandom, faHeart, faFire, faSadCry } from '@fortawesome/free-solid-svg-icons'
import { faTwitter } from '@fortawesome/free-brands-svg-icons'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { saveAs } from 'file-saver';

const FileUpload = () => {
  const [isLoading, setLoading] = useState(true);
  const [file, setFile] = useState({});
  const [title, setTitle] = useState('');
  const [search, setSearch] = useState('');
  const [meme, setMeme] = useState(false);
  const [jobTitle, setjobTitle] = useState('');
  const [gif, setGif] = useState("");
  const [color, setColor] = useState("rgba(255, 255, 255, 0.0");
  const [message, setMessage] = useState('Upload Started!');
  const [dropped, setDropped] = useState(false);
  const [jobActive, setjobActive] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [percent, setPercent] = useState(0);
  const [gifList, setgifList] = useState({});
  const [inc, setInc] = useState(1);

  useLayoutEffect(() => {
    axios.get("/session")
    .then(res => {
      toast.dark("Welcome to Mp3 Anime. Drop some audio and make a video!");
      if (res.data.jobActive) getData();
      setjobActive(res.data.jobActive);
      setjobTitle(res.data.title);
      setSearch(res.data.search);
      setLoading(false);
    })
    .catch(error => {
      toast.dark("Session Error");
    })
  }, []);

  useLayoutEffect(() => {
    setGif('https://media.giphy.com/media/p0DJuJj18Gcz6/giphy.gif'); //loading
    const timeoutId = setTimeout(() => giphySearch(), 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const giphySearch = () => {
    let searchData = new FormData();
    searchData.append('search', search);
    axios.post('/giphySearch', searchData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then(res => {
      setgifList(res.data.gifList.data);
      if (res.data.gifList.data.length === 0 || res.data.gifList.data.length === undefined) {
        setGif('https://media.giphy.com/media/zLCiUWVfex7ji/giphy.gif'); //no results
        return;
      }
      setGif(res.data.gifList.data[0].images.original.url);
    })
    .catch(error => {
      toast.dark("Search Error");
      setGif('https://media.giphy.com/media/xTiN0L7EW5trfOvEk0/giphy.gif'); //error
    })
  }

  const shuffleGif = () => {
    if (gifList.length === 0 || gifList.length === undefined) {
      setGif('https://media.giphy.com/media/zLCiUWVfex7ji/giphy.gif');
      return;
    }
    try {
      setInc((inc+1) % gifList.length);
      setGif(gifList[inc].images.original.url);
    } catch (e) {
      setGif('https://media.giphy.com/media/xTiN0L7EW5trfOvEk0/giphy.gif'); //error
    }
  }

  const { getRootProps, getInputProps, isDragActive, isDragReject} = useDropzone({
    maxFiles: 1, // number of files,
    accept: "audio/mpeg, audio/m4a, audio/wav, audio/aif, audio/aiff, .m4a, .wav, .mp3, .aiff, .aif",
    maxSize: 50000000,
    multiple: false,
    onDropAccepted: (acceptedFile) => {
      setDropped(true);
      setFile(
        // convert preview string into a URL
        Object.assign(acceptedFile[0], {
          preview: URL.createObjectURL(acceptedFile[0]),
        })
      );
      setTitle(acceptedFile[0].name.split(".", 1));
    },
    onDropRejected: (rejectFile) => {
      toast.dark("Only 50mb audio files please :)");
    }
  })

  useLayoutEffect(() => {
    if(!isDragActive && !isDragReject) {
      setColor("rgba(255, 255, 255, 0.0"); //none
    } else if (isDragActive && !isDragReject) {
      setColor("rgba(102, 187, 107, 0.9"); //green
    } else if (isDragActive && isDragReject) {
      setColor("rgba(239, 83, 79, 0.9"); //red
    } else {
      setColor("rgba(239, 83, 79, 0.9"); //red
    }
  }, [isDragActive])

  const getData = () => {
    axios({
      url: '/progress', //your url
      method: 'GET',
    }).then((res) => {
      if (res.data.message === 'Video creation error') {
        setPercent(res.data.progress);
        setMessage('Oops! Video creation error,\nplease try a different file or gif.');
        return;
      }
      setjobActive(res.data.jobActive);
      setPercent(res.data.progress);
      setMessage(res.data.message);
      if (res.data.progress!==100) {
        setTimeout(getData, 500);
      }
    });
  }

  const handleEnter = (e) => {
    if(e.key === 'Enter'){
      e.preventDefault();
      return false;
    }
  }

  const onSubmit = async e => {
    toast.dark("Song processing, scroll on twitter and come back like 1 minute.");
    setjobActive(true);
    e.preventDefault();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('meme', meme);
    formData.append('gif', gif);
    setjobTitle(title)
    axios.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 5000, //15 seconds
      onUploadProgress: progressEvent => {
        setMessage('Audio Uploading')
        setPercent(Math.min(50, parseInt(Math.round((progressEvent.loaded * 100 / progressEvent.total) / 2))));
      }
    })
    .then((res) => {
      setMessage(res.data.message);
      setPercent(res.data.progress);
      setTimeout(getData, 500);
    })
    .catch((err) => {
      setMessage(err.message);
    });
  };

  const download = async e => {
    axios({
      url: '/download', //your url
      method: 'GET',
      responseType: 'blob', // important
    })
    .then((res) => {
      if (res.data.message === 'timeout') {
        setMessage('download failed, try different browser <3');
        setPercent(0);
        return;
      }
      const blobUrl = window.URL.createObjectURL(res.data);
      if (!!new Blob()) {
        saveAs(blobUrl, `${jobTitle}.mp4`);
      } else {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', `${jobTitle}.mp4`);
        document.body.appendChild(link);
        link.click();
      }
      setMessage('Upload another if you want! :)');
      toast.dark("Help this server stay alive with links below. <3 thx!");
      setDownloaded(true);
    })
    .catch((err) => {
      setMessage(err.message);
    });
  }

  if (isLoading) {
    return (
      <Fragment>
      <div className="lds-ellipsis">
        <div></div><div></div>
        <div></div><div></div>
      </div>
      </Fragment>
    );
  };

  return (
    <Fragment>
      <div>
        <ToastContainer position="top-left"></ToastContainer>
      </div>
      {!jobActive && <Fragment>
        <div id='file-dropzone' style={{backgroundColor: color}} {...getRootProps({})}>
          <input form="myForm" id='customFile' {...getInputProps()} />
            <label className='custom-file-label' htmlFor="customFile">
              {!isDragActive && !isDragReject && "Drop audio here!"}
              {isDragActive && !isDragReject &&  "Drop it like it's hot!"}
              {isDragActive && isDragReject &&   "Please use mp3, wav, or aiff"}
            </label>
            {!isDragActive && !isDragReject && <FontAwesomeIcon icon={faCompactDisc} size="6x" />}
            {isDragActive && !isDragReject &&  <FontAwesomeIcon icon={faFire} size="6x" />}
            {isDragActive && isDragReject &&   <FontAwesomeIcon icon={faSadCry} size="6x" />}
            <label className='custom-file-label small' htmlFor="customFile">
            {!isDragActive && "50 MB max."}
            </label>
        </div>
        {dropped && <Fragment>
          <div className="info-box">
            <form id="myForm" onSubmit={onSubmit} autoComplete="off">
              <h2>
                  <FontAwesomeIcon className="button-space" icon={faHeart} size="1x"/>
                  MP3 Anime
                  <FontAwesomeIcon className="button-space" icon={faHeart} size="1x"/>
              </h2>
              <div>
                <label className="input-label">Title</label>
                <input form="myForm" className="form-control my-input" type="text" placeholder="beat for kanye" value={title} onChange={(e) => setTitle(e.target.value)} onKeyPress={(e) => handleEnter(e)} required/>
              </div>
              <div>
                <label className="input-label">Loop</label>
                <input id="search" className="form-control my-input gif-search" type="search" placeholder="search gif" value={search} onChange={(e) => setSearch(e.target.value)} onKeyPress={(e) => handleEnter(e)} required/>
                <div id="box-image"
                    className="d-flex align-items-center justify-content-center"
                    onClick={shuffleGif}
                    style={{ backgroundImage: `url(${gif})`
                  }}>
                    <FontAwesomeIcon className="box-icon" icon={faRandom} size="2x"/>
                </div>
              </div>
              <div className='meme-btn-cont'>
                <div aria-label="Memeify" onClick={() => setMeme(meme => !meme)} form="myForm" className='my-btn meme-btn' style={meme ? {backgroundColor: '#ED0F89'} : {backgroundColor: '#3C3C3C'}}>
                  <FontAwesomeIcon icon={faGrinSquintTears}/>
                </div>
              </div>
              <button form="myForm" type='submit' value='Upload' className='my-btn'>
              Create
              <FontAwesomeIcon className="button-space" icon={faArrowUp}/>
              </button>
            </form>
          </div>
        </Fragment>}
      </Fragment>}

      {jobActive && <Fragment>
        <div className="info-box">
          <Progress percentage={percent} message={message}>
            <a aria-label="upload message" href="/">{message}</a>
          </Progress>

          {!downloaded &&
          <button disabled={percent!==100} onClick={download} className='my-btn dl-btn'> Download
            <FontAwesomeIcon className="button-space" icon={faArrowDown}/>
          </button> }

          {downloaded &&
          <a aria-label="tweet video" href="https://twitter.com/intent/tweet?hashtags=mp3anime&text=i%20💖" className='my-btn share-btn'> Share
            <FontAwesomeIcon className="button-space" icon={faTwitter}/>
          </a> }
        </div>
      </Fragment>}
    </Fragment>
  );
};

export default FileUpload;
