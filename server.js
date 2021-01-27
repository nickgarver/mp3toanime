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

//setup mongodb
var store = new MongoDBStore({
  uri: process.env.DB_mongoUri,
  collection: 'mp3anime'
});
store.on('error', function(error) {
  console.log(error);
});

//setup production or local session
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  app.enable('trust proxy');
  app.use(require('express-session')({
    genid: function(req) {
      return uuidv4() // use UUIDs for session IDs
    },
    secret: 'keyboard cat',
    proxy: true,
    cookie: {
      maxAge: 1000 * 60 * 10, // 10 min
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
      maxAge: 1000 * 60 * 10, // 10 min
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
  req.session.progress = 51;
  req.session.jobActive = true;
  req.session.message = 'Making cute video :-)';
  req.session.title = req.body.title;
  req.session.audioPath = `${__dirname}/uploads/audio_${req.sessionID}`;
  req.session.photoPath = `${__dirname}/client/public` + req.body.image;
  req.session.videoPath = `${__dirname}/uploads/out_${req.sessionID}.mp4`;
  if (fs.existsSync(req.session.videoPath)) {
      fs.unlinkSync(req.session.videoPath);
  }
  if (fs.existsSync(req.session.audioPath)) {
      fs.unlinkSync(req.session.audioPath);
  }
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
    ffmpegStart(req, res);
    res.json({
      progress: req.session.progress,
      message:  req.session.message,
    });
  });
});

app.get('/progress', (req, res) => {
  if (req.session.progress === undefined){
    res.json({
      jobActive: true,
      progress: 50,
      message: "session undefined"
    });
  } else {
    res.json({
      jobActive: req.session.jobActive,
      progress: req.session.progress,
      message: req.session.message
    });
  }
});

app.get('/session', (req, res) => {
  const gifCount = fs.readdirSync(`${__dirname}/client/public/anime`).length;
  if (!fs.existsSync(req.session.videoPath) && req.session.jobActive) {
    //usually error
    req.session.jobActive = false;
    res.json({
      jobActive: req.session.jobActive,
      gifCount: gifCount,
      title: "not set"
    });
  } else {
    res.json({
      jobActive: req.session.jobActive,
      gifCount: gifCount,
      title: req.session.title
    });
  }
});

app.get('/download', (req, res) => {
  if (req.sessionID === undefined) {
    res.json({
      message: 'timeout',
    });
  } else {
    req.session.jobActive = false;
    if (fs.existsSync(req.session.videoPath)) {
      res.download(req.session.videoPath, 'tempName.mp4', () => {
        fs.unlinkSync(req.session.videoPath);
      });
    }
  }
});

function ffmpegStart(req, res) {
  ( async () => {
    const process = new FFMpegProgress(['-i', req.session.audioPath, '-ignore_loop', '0', '-i', req.session.photoPath, '-vf', "pad=ceil(iw/2)*2:ceil(ih/2)*2", '-shortest', '-strict', '-2', '-c:v', 'libx264', '-threads', '6', '-c:a', 'aac', '-b:a', '192k', '-pix_fmt', 'yuv420p', '-shortest', '-crf', '27','-preset','veryfast', req.session.videoPath]);
    process.once('details', (details) => {
      tFrames = details.duration * details.fps;
    });

    process.on('progress', (progress) => {
      req.session.progress = Math.min(99, Math.round(50 + ((Number(progress.frame) / tFrames) *100) / 2));
      if (req.session.progress > 80) {
        req.session.message = 'Almost finished!'
      }
      if (req.session.progress == 99) {
        req.session.message = 'So close to being ready'
      }
      req.session.save(function(err) {
        if (err) {
          console.log(err);
        }
      })
    });

    process.on('uncaughtException', (e) => {
      req.session.jobActive = false;
      req.session.message = 'Video creation error';
      req.session.progress = 0;
      console.log('ffmpeg uncaughtException: ' + e);
    });

    process.once('end', (end) => {
      req.session.message = req.session.title + ' is ready!';
      req.session.progress = 100;
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
}

if (!fs.existsSync(`${__dirname}/uploads`)){
    fs.mkdirSync(`${__dirname}/uploads`);
}

var myInt = setInterval(function () {
  var result = findRemoveSync(`${__dirname}/uploads`, {extensions: ['.mp4', '.mp3', '.aif', '.aiff', '.wav'], limit: 100, age: {seconds: 1000*15}});
}, 1000*60*5);

app.listen(PORT, () => console.log(`Server Started at ${PORT}`));
