const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();
const {FFMpegProgress} = require('ffmpeg-progress-wrapper');
const fs = require('fs')

const PORT = process.env.PORT || 5000;
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

if (!fs.existsSync(`${__dirname}/client/public/uploads`)){
    fs.mkdirSync(`${__dirname}/client/public/uploads`);
}
// Upload Endpoint
app.post('/upload', (req, res) => {
  if (req.files === null) {
    return res.status(400).json({
      msg: 'No file uploaded'
    });
  }
  const file = req.files.file;

  file.mv(`${__dirname}/client/public/uploads/audio_${process.pid}`, err => {
    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }

    audioPath = `${__dirname}/client/public/uploads/audio_${process.pid}`;
    photoPath = `${__dirname}/client/public` + req.body.image;
    videoPath = `${__dirname}/client/public/uploads/out_${process.pid}.mp4`;
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
          progAmt = Math.min(99, Math.round(50 + ((Number(progress.frame) / tFrames) *100) / 2));
        });

        process.on('UnhandledPromiseRejectionWarning', (e) => {
          progMsg = 'Error!';
          progAmt = 0;
          dlReady = false;
          console.log('ffmpeg error: ' + e);
        });

        process.once('end', (end) => {
          console.log('ffmpeg end');
          progMsg = 'Your video is ready...';
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

app.put('/gifCount', (req, res) => {
    res.json({
      gifCount: gifCount
    });
});

app.post('/cleanup', (req, res) => {
  console.log('one time!');
  res.json({
    msg: 'true'
  });
  dlReady = false;
  if (fs.existsSync(videoPath)) {
    fs.unlink(videoPath, (err) => {
      if (err) {
        console.error(err)
        return
      }
    })
  }
  if (fs.existsSync(audioPath)) {
    fs.unlink(audioPath, (err) => {
      if (err) {
        console.error(err)
        return
      }
    })
  }
});

app.get('/download', (req, res) => {
  if (dlReady) {
    // let videoDownload = videoPath.toString();
    res.download(videoPath, 'Mp3 to Anime.mp4', () => {
      fs.unlinkSync(videoPath);
    });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
}

app.listen(PORT, () => console.log(`Server Started at ${PORT}`));
