const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();
const {FFMpegProgress} = require('ffmpeg-progress-wrapper');
const fs = require('fs')
const got = require("got");

app.use(fileUpload());

let progAmt = 50;
let dlReady = false;
let progMsg = 'Making a cute video.. :-)';
let audioPath = '';
let photoPath = '';
let videoPath = '';
let title = '';
let tFrames = '';
const gifCount = fs.readdirSync(`${__dirname}/client/public/anime`).length;

// Upload Endpoint
app.post('/upload', (req, res) => {
  if (req.files === null) {
    return res.status(400).json({
      msg: 'No file uploaded'
    });
  }
  const file = req.files.file;

  file.mv(`${__dirname}/client/public/uploads/${file.name}`, err => {
    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }

    audioPath = `${__dirname}/client/public/uploads/${file.name}`;
    photoPath = `${__dirname}/client/public` + req.body.image;
    videoPath = `${__dirname}/client/public/uploads/out.mp4`;
    title = req.body.title;
    res.json({
      fileName: file.name,
      filePath: `/uploads/${file.name}`
    });

      ( async () => {
        //const process = new FFMpegProgress(['-loop', '1', '-i' , photoPath , '-i', audioPath, '-c:v', 'libx264', '-tune', 'stillimage', '-c:a', 'aac', '-b:a', '192k', '-vf', "scale='iw-mod(iw,2)':'ih-mod(ih,2)',format=yuv420p", '-shortest', '-movflags', '+faststart', '-vf', 'scale=1280:720' , videoPath]);
        const process = new FFMpegProgress(['-i', audioPath, '-ignore_loop', '0', '-i', photoPath, '-vf', "pad=ceil(iw/2)*2:ceil(ih/2)*2", '-shortest', '-strict', '-2', '-c:v', 'libx264', '-threads', '5', '-c:a', 'aac', '-b:a', '192k', '-pix_fmt', 'yuv420p', '-shortest', videoPath]);
        process.once('details', (details) => {
          tFrames = details.duration * details.fps;
        });

        process.on('progress', (progress) => {
          progAmt = Math.min(100, Math.round(50 + ((Number(progress.frame) / tFrames) *100) / 2));
        });

        process.on('UnhandledPromiseRejectionWarning', (e) => {
          progMsg = 'Error!';
          progAmt = 0;
          dlReady = false;
          console.log('ffmpeg error: ' + e);
        });

        process.once('end', (end) => {
          console.log('ffmpeg end');
          progMsg = 'Your video is ready!';
          progAmt = 100;
          dlReady = true;
          //delete audio
          fs.unlink(audioPath, (err) => {
            if (err) {
              console.error(err)
              return
            }
          });
          //hand video back to user

        });
        await process.onDone();
      })();
  });

});

app.get('/progress', (req, res) => {
    res.json({
      progAmt: progAmt,
      progMsg: progMsg,
      dlReady: dlReady
    });
});

app.get('/gifCount', (req, res) => {
    res.json({
      gifCount: gifCount
    });
});

app.get('/download', (req, res) => {
  if (dlReady) {
    let videoDownload = videoPath.toString();
    res.download(videoDownload, 'beat video.mp4')
  }
});

app.listen(5000, () => console.log('Server Started...'));
