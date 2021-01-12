import React, { Fragment, useState, useLayoutEffect } from 'react';
import Progress from './Progress';
import { useDropzone } from "react-dropzone"
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUp, faArrowDown, faCompactDisc, faRandom, faSmileBeam } from '@fortawesome/free-solid-svg-icons'

const FileUpload = () => {
  let imgPick;
  const [file, setFile] = useState({});
  const [filename, setFilename] = useState('');
  const [title, setTitle] = useState(filename);
  const [image, setImage] = useState("");
  const [color, setColor] = useState("rgba(255, 255, 255, 0.0");
  const [message, setMessage] = useState('Upload Initialized');
  const [dropped, setDropped] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ready, setReady] = useState(false);
  const [uploadPercentage, setUploadPercentage] = useState(0);
  const [gifCount, setGifCount] = useState(0);
  let progressRefresh;

  const { getRootProps, getInputProps, isDragActive, isDragReject} = useDropzone({
    maxFiles: 1, // number of files,
    accept: "audio/mpeg",
    onDropAccepted: (acceptedFile) => {
      shuffleImage();
      setDropped(true);
      setFile(
        // convert preview string into a URL
        Object.assign(acceptedFile[0], {
          preview: URL.createObjectURL(acceptedFile[0]),
        })
      );
      setFilename(acceptedFile[0].name);
      setTitle(acceptedFile[0].name);
    },
    onDropRejected: () => {
        console.log("drop rejected, do nothing.");
    },
  })

  async function getProgress() {
      const res = await axios.get('/progress');
      if (res.data.dlReady || res.data.progMsg === 'Error') {
        clearInterval(progressRefresh);
      }
      setUploadPercentage(res.data.progAmt);
      setMessage(res.data.progMsg);
      setReady(res.data.dlReady);
  }

  useLayoutEffect(() => {
  async function countGifs() {
    const response = await axios.get('/gifCount');
    setGifCount(response.data.gifCount)
  }
    countGifs()
  }, [])

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

  const shuffleImage = async e => {
    imgPick = Math.floor(Math.random() * gifCount) + 1;
    setImage("/anime/giphy-" + imgPick.toString() + ".gif");
  }

  const onSubmit = async e => {
    setSubmitted(true);
    e.preventDefault();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', filename);
    formData.append('title', title);
    formData.append('image', image);

    try {
      await axios.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: progressEvent => {
          //start upload
          setMessage('Audio Uploading')
          setUploadPercentage(
            parseInt(
              Math.round(((progressEvent.loaded * 100) / progressEvent.total) / 2)
            )
          );
        }
      });
      //start timer
      progressRefresh = setInterval(getProgress, 500);

    } catch (err) {
      if (err.response.status === 500) {
        setMessage('There was a problem with the server');
      } else {
        setMessage(err.response.data.msg);
      }
    }
  };

  const getVideo = async e => {
    axios({
      url: '/download', //your url
      method: 'GET',
      responseType: 'blob', // important
    }).then((response) => {
       const url = window.URL.createObjectURL(new Blob([response.data]));
       const link = document.createElement('a');
       link.href = url;
       link.setAttribute('download', 'mp3toanime.mp4'); //or any other extension
       document.body.appendChild(link);
       link.click();
    });
  }


  return (
    <Fragment>
      <div id='file-dropzone' style={{backgroundColor: color}} {...getRootProps({})}>
        <input form="myForm" id='customFile' {...getInputProps()} />
        <label className='custom-file-label' htmlFor="customFile">
          {!isDragActive && !isDragReject && "Drop an mp3!"}
          {isDragActive && !isDragReject && "Drop it like it's hot!"}
          {isDragActive && isDragReject && "Not an mp3"}
        </label>
        {!dropped && <FontAwesomeIcon icon={faCompactDisc} size="6x" />}
      </div>

      {dropped && <Fragment>
        <div id="info-box">
          {!submitted &&
          <Fragment>
            <form id="myForm" onSubmit={onSubmit}>
              <h2>
                  <FontAwesomeIcon className="button-space" icon={faSmileBeam} size="1x"/>
                  MP3 to Anime
              </h2>
              <div>
                <label className="input-label">Title</label>
                <input form="myForm" className="form-control my-input" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required/>
              </div>
              <div id="box">
                <label className="input-label">Anime</label>
                  <div id="box-image"
                    className="d-flex align-items-center justify-content-center"
                    onClick={shuffleImage}
                    style={{ backgroundImage: `url(${process.env.PUBLIC_URL + image})`
                  }}>
                    <FontAwesomeIcon className="box-icon" icon={faRandom} size="2x"/>
                </div>
              </div>

              <button form="myForm" type='submit' value='Upload' className='my-btn'>
              Upload
              <FontAwesomeIcon className="button-space" icon={faArrowUp}/>
              </button>
            </form>
          </Fragment> }

          {submitted &&
          <Progress percentage={uploadPercentage} message={message}>
            <a href="https://github.com/nickgarver">{message}</a>
          </Progress> }

          {ready &&
          <button onClick={getVideo} className='my-btn'> Download
            <FontAwesomeIcon className="button-space" icon={faArrowDown}/>
          </button> }

        </div>
      </Fragment>}
    </Fragment>
  );
};

export default FileUpload;
