import React, { Fragment, useState, useLayoutEffect } from 'react';
import Progress from './Progress';
import { useDropzone } from "react-dropzone"
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUp, faArrowDown, faCompactDisc, faRandom, faHeart, faFire, faSadCry } from '@fortawesome/free-solid-svg-icons'
import { faTwitter } from '@fortawesome/free-brands-svg-icons'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const FileUpload = () => {
  let imgPick;
  const [isLoading, setLoading] = useState(true);
  const [file, setFile] = useState({});
  const [title, setTitle] = useState('');
  const [jobTitle, setjobTitle] = useState('');
  const [image, setImage] = useState("");
  const [color, setColor] = useState("rgba(255, 255, 255, 0.0");
  const [message, setMessage] = useState('Upload Started!');
  const [dropped, setDropped] = useState(false);
  const [jobActive, setjobActive] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [percent, setPercent] = useState(0);
  const [gifCount, setGifCount] = useState(0);

  useLayoutEffect(() => {
    axios.get("/session")
      .then(res => {
        toast.dark("Welcome to Mp3 Anime. Drop some audio and make a video!");
        setjobActive(res.data.jobActive);
        setGifCount(res.data.gifCount);
        setjobTitle(res.data.title);
        if (res.data.jobActive) {
          getData();
        }
        setLoading(false);
      })
      .catch(error => {
        toast.dark("Session Error");
      })
  }, []);

  const shuffleImage = async e => {
    imgPick = Math.floor(Math.random() * gifCount) + 1;
    setImage("/anime/giphy-" + imgPick.toString() + ".gif");
  }

  const { getRootProps, getInputProps, isDragActive, isDragReject} = useDropzone({
    maxFiles: 1, // number of files,
    accept: "audio/mpeg, audio/m4a, audio/wav, audio/aif, audio/aiff, .m4a, .wav, .mp3, .aiff, .aif",
    maxSize: 50000000,
    multiple: false,
    onDropAccepted: (acceptedFile) => {
      shuffleImage();
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
      console.log(rejectFile[0].file.type);
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
      setjobActive(res.data.jobActive);
      setPercent(res.data.progress);
      setMessage(res.data.message);
      if (res.data.progress!==100) {
        setTimeout(getData, 500);
      }
    });
  }

  const onSubmit = async e => {
    toast.dark("Song processing, scroll on twitter and come back like 1 minute.");
    setjobActive(true);
    e.preventDefault();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('image', image);
    formData.append('title', title);
    setjobTitle(title)
    const res = await axios.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 5*1000*60, //5 min
      onUploadProgress: progressEvent => {
        setMessage('Audio Uploading')
        setPercent(Math.min(50, parseInt(Math.round((progressEvent.loaded * 100 / progressEvent.total) / 2))));
      }
    });
    setMessage(res.data.message);
    setPercent(res.data.progress);
    setTimeout(getData, 500);
  };

  const download = async e => {
    axios({
      url: '/download', //your url
      method: 'GET',
      responseType: 'blob', // important
    }).then((res) => {
      if (res.data.message === 'timeout') {
        setMessage('session timeout, please reupload <3');
        setPercent(0);
      } else {
        const url = window.URL.createObjectURL(res.data);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${jobTitle}.mp4`); //or any other extension
        document.body.appendChild(link);
        link.click();
        setMessage('Upload another if you want! :)');
        toast.dark("Help this server stay alive with links below. <3 thx!");
        setDownloaded(true);
      }
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
        </div>
        {dropped && <Fragment>
          <div className="info-box">
            <form id="myForm" onSubmit={onSubmit}>
              <h2>
                  <FontAwesomeIcon className="button-space" icon={faHeart} size="1x"/>
                  MP3 to Anime
              </h2>
              <div>
                <label className="input-label">Video Title</label>
                <input form="myForm" className="form-control my-input" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required/>
              </div>
              <div id="box">
                <label className="input-label">Anime Loop</label>
                  <div id="box-image"
                    className="d-flex align-items-center justify-content-center"
                    onClick={shuffleImage}
                    style={{ backgroundImage: `url(${process.env.PUBLIC_URL + image})`
                  }}>
                    <FontAwesomeIcon className="box-icon" icon={faRandom} size="2x"/>
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
