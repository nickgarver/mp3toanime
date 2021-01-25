require('dotenv').config()
const fileUpload = require('express-fileupload');
const {FFMpegProgress} = require('ffmpeg-progress-wrapper');
const fs = require('fs');
const findRemoveSync = require('find-remove');
const express = require('express');
var session = require('express-session')
var MongoDBStore = require('connect-mongodb-session')(session);
const app = express();
const { v4: uuidv4 } = require('uuid');
const PORT = process.env.PORT || 5000;

//force ssl
app.use(function(req, res, next) {
    if (req.get('X-Forwarded-Proto')=='https' || req.hostname == 'localhost') {
        next();
    } else if(req.get('X-Forwarded-Proto')!='https'){
        res.redirect('https://' + req.hostname + req.url);
    }
})

var store = new MongoDBStore({
  uri: process.env.DB_mongoUri,
  collection: 'mp3anime'
});
store.on('error', function(error) {
  console.log(error);
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  app.set('trust proxy', 1) // trust first proxy
  app.use(require('express-session')({
    genid: function(req) {
      return uuidv4() // use UUIDs for session IDs
    },
    secret: 'keyboard cat',
    proxy: true,
    cookie: {
      maxAge: 1000 * 60 * 15, // 10 min
      secure: true
    },
    store: store,
    resave: true,
    saveUninitialized: true
  }));
} else {
  app.use(require('express-session')({
    genid: function(req) {
      return uuidv4() // use UUIDs for session IDs
    },
    secret: 'keyboard cat',
    cookie: {
      maxAge: 1000 * 60 * 15, // 10 min
      secure: false
    },
    store: store,
    resave: true,
    saveUninitialized: true
  }));
}

app.use(fileUpload());

// Upload Endpoint
app.post('/upload', (req, res) => {
  if (req.files === null) {
    return res.status(400).json({ msg: 'No file uploaded'});
  }
  req.session.progAmt = 50;
  req.session.dlReady = false;
  req.session.cleaned = false;
  req.session.progMsg = 'Making cute video :-)';
  req.session.audioPath = `${__dirname}/uploads/audio_${req.sessionID}`;
  req.session.photoPath = `${__dirname}/client/public` + req.body.image;
  req.session.videoPath = `${__dirname}/uploads/out_${req.sessionID}.mp4`;
  req.session.touch();
  req.session.save(function(err) {
    if (err) {
      console.log(err);
    }
  })
  let tFrames = '';
  const file = req.files.file;

  file.mv(`${__dirname}/uploads/audio_${req.sessionID}`, err => {
    if (err) {
      return res.status(500).send(err);
    }
    ( async () => {
      const process = new FFMpegProgress(['-i', req.session.audioPath, '-ignore_loop', '0', '-i', req.session.photoPath, '-vf', "pad=ceil(iw/2)*2:ceil(ih/2)*2", '-shortest', '-strict', '-2', '-c:v', 'libx264', '-threads', '5', '-c:a', 'aac', '-b:a', '192k', '-pix_fmt', 'yuv420p', '-shortest', req.session.videoPath]);
      process.once('details', (details) => {
        tFrames = details.duration * details.fps;
      });

      process.on('progress', (progress) => {
        req.session.progAmt = Math.min(99, Math.round(50 + ((Number(progress.frame) / tFrames) *100) / 2));
        req.session.save(function(err) {
          if (err) {
            console.log(err);
          }
        })
      });

      process.on('uncaughtException', (e) => {
        req.session.progMsg = 'Error';
        req.session.progAmt = 0;
        req.session.dlReady = false;
        console.log('ffmpeg uncaughtException: ' + e);
      });

      process.once('end', (end) => {
        console.log('upload finished');
        req.session.progMsg = 'Your video is ready!';
        req.session.progAmt = 100;
        req.session.dlReady = true;
        req.session.touch();
        req.session.save(function(err) {
          if (err) {
            console.log(err);
          }
        })
        res.end();
        //delete audio
        fs.unlink(req.session.audioPath, (err) => {
          if (err) {
            console.error(err)
            return
          }
        });
      });
      await process.onDone();
    })();
  });
});

app.get('/progress', (req, res) => {
  if (req.session.progAmt === undefined){
    console.log('progAmt undefined');
    res.json({
      progAmt: 50,
      progMsg: "session undefined",
      dlReady: false
    });
  } else {
    res.json({
      progAmt: req.session.progAmt,
      progMsg: req.session.progMsg,
      dlReady: req.session.dlReady
    });
  }
});

app.get('/gifCount', (req, res) => {
  const gifCount = fs.readdirSync(`${__dirname}/client/public/anime`).length;
  res.json({
    gifCount: gifCount
  });
});

app.get('/download', (req, res) => {
  req.session.touch();
  if (fs.existsSync(req.session.videoPath)) {
    res.download(req.session.videoPath, 'tempName.mp4', () => {
      fs.unlinkSync(req.session.videoPath);
    });
  }
});

if (!fs.existsSync(`${__dirname}/uploads`)){
    fs.mkdirSync(`${__dirname}/uploads`);
}

var result = findRemoveSync(`${__dirname}/uploads`, {extensions: ['.mp4', '.mp3', '.aif', '.aiff', '.wav'], limit: 100, age: {seconds: 1000*15}});
//Write "Hello" every 500 milliseconds:
var myInt = setInterval(function () {
  var result = findRemoveSync(`${__dirname}/uploads`, {extensions: ['.mp4', '.mp3', '.aif', '.aiff', '.wav'], limit: 100, age: {seconds: 1000*15}});
}, 1000*15);

app.listen(PORT, () => console.log(`Server Started at ${PORT}`));
