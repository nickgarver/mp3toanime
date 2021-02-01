require('dotenv').config()
const fileUpload = require('express-fileupload');
const {FFMpegProgress} = require('ffmpeg-progress-wrapper');
const fs = require('fs');
const download = require('image-downloader')
const findRemoveSync = require('find-remove');
const express = require('express');
var session = require('express-session');

var MongoDBStore = require('connect-mongodb-session')(session);
var giphy = require('giphy-api')('PQ689JPnDjFooVH1IacoquhmmUYjukUQ');
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

app.post('/upload', (req, res) => {
  if (req.files === null) {
    return res.status(400).json({ msg: 'No file uploaded'});
  }
  req.session.progress = 51;
  req.session.jobActive = true;
  req.session.title = req.body.title;
  req.session.gif = req.body.gif;
  req.session.meme = req.body.meme;
  req.session.message = 'Making your video! :-)';
  req.session.audioPath = `${__dirname}/uploads/audio_${req.sessionID}`;
  req.session.gifPath = `${__dirname}/uploads/image_${req.sessionID}.gif`;
  req.session.videoPath = `${__dirname}/uploads/out_${req.sessionID}.mp4`;
  if (fs.existsSync(req.session.videoPath)) {
      fs.unlinkSync(req.session.videoPath);
  }
  if (fs.existsSync(req.session.audioPath)) {
      fs.unlinkSync(req.session.audioPath);
  }
  if (fs.existsSync(req.session.gifPath)) {
      fs.unlinkSync(req.session.gifPath);
  }
  req.session.save(function(err) {
    if (err) console.log(err);
  })
  let tFrames = '';
  const file = req.files.file;

  file.mv(`${__dirname}/uploads/audio_${req.sessionID}`, err => {
    if (err) {
      return res.status(500).send(err);
    }
    res.json({
      progress: req.session.progress,
      message:  req.session.message,
    });
    downloadImage(req.sessionID);
  });
});

app.get('/progress', (req, res) => {
  if (req.session.progress === undefined){
    res.json({
      jobActive: true,
      progress: 50,
      message: "session undefined"
    });
  }
  res.json({
    jobActive: req.session.jobActive,
    progress: req.session.progress,
    message: req.session.message
  });
});

app.get('/session', (req, res) => {
  if (!fs.existsSync(req.session.videoPath) && req.session.jobActive) {
    // Error: no video and the job is active
    req.session.jobActive = false;
    req.session.user = req.headers['user-agent'];
    res.json({
      jobActive: req.session.jobActive,
      title: "not set",
      search: 'adventure time'
    });
  } else if (req.session.user === undefined || req.session.jobActive === undefined) {
    // New User or Existing user and no job done before
    req.session.user = req.headers['user-agent'];
    res.json({
      jobActive: null,
      title: "default title",
      search: 'adventure time'
    });
  } else {
    // Existing user with search history
    res.json({
      jobActive: req.session.jobActive,
      title: req.session.title,
      search: req.session.search
    });
  }
});

app.post('/giphySearch', (req, res) => {
  giphy.search({
    q: req.body.search,
    limit: 20
  })
  .then((gifs) => {
    req.session.search = req.body.search;
    res.json({
      gifList: gifs
    });
  })
  .catch((e) => console.log(e));
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

function downloadImage(myID) {
  store.get(myID,function(err,session){
    if (err) throw err;
    download.image({
      url: session.gif,
      dest: session.gifPath
    })
    .then(() => {
      ffmpegStart(myID, session.meme, session.audioPath, session.gifPath, session.videoPath);
    })
    .catch((e) => console.error(e));
  });
}

function ffmpegStart(myID,meme,audioPath,gifPath,videoPath) {
  ( async () => {
    let command = [];
    if (meme === 'true') {
      command = ['-y', '-i', audioPath, '-ignore_loop', '0', '-i',
      gifPath, '-vf', "amplify=radius=5:factor=30000,hue=s=7:b=4,scale=720:trunc(ow/a/2)*2", '-shortest', '-strict', '-2', '-c:v', 'libx264', '-threads', '6', '-c:a', 'aac', '-b:a', '128k', '-filter_complex', 'stereotools=level_in=15:softclip=1,acompressor=level_in=1:makeup=2,asetrate=44100*1.0,aresample=44100', '-pix_fmt', 'yuv420p', '-crf', '51', '-preset', 'ultrafast', '-profile:v', 'baseline', '-t', '140', '-fs', '50M', videoPath];
    } else {
      command = ['-y', '-i', audioPath, '-ignore_loop', '0', '-i',
      gifPath, '-vf', "scale=720:trunc(ow/a/2)*2", '-shortest', '-strict', '-2', '-c:v', 'libx264', '-threads', '6', '-c:a', 'aac', '-b:a', '256k', '-pix_fmt', 'yuv420p', '-crf', '28', '-preset', 'faster', '-profile:v', 'baseline', '-t', '140', '-fs', '50M', videoPath]
    }
    const process = new FFMpegProgress(command);
    process.once('details', (details) => {
      tFrames = details.duration * details.fps;
    });

    process.on('progress', (progress) => {
      store.get(myID,function(err,session){
        if (err) throw err;
        session.progress = Math.min(99, Math.round(50 + ((Number(progress.frame) / tFrames) *100) / 2));
        if (session.progress > 80) session.message = 'Almost finished!';
        if (session.progress == 99) session.message = 'So close to being ready';
        store.set(myID, session, function(err) { if (err) throw err; })
      });
    });

    process.once('end', (end) => {
      store.get(myID,function(err,session){
        session.message = session.title + ' is ready!';
        session.progress = 100;
        store.set(myID, session, function(err) { if (err) throw err; })
      })
      fs.unlink(audioPath, (err) => { if (err) throw err; });
      fs.unlink(gifPath, (err) => { if (err) throw err; });
    });

    await process.onDone();

  })()
  .catch((e) => {
    console.error('weird ffmpeg error');
    store.get(myID,function(err,session){
      if (err) throw err;
      session.jobActive = false;
      session.message = 'Video creation error';
      session.progress = 0;
      store.set(myID, session, function(err) { if (err) throw err; })
    })
  });
}

if (!fs.existsSync(`${__dirname}/uploads`)){
    fs.mkdirSync(`${__dirname}/uploads`);
}

var myInt = setInterval(function () {
  var result = findRemoveSync(`${__dirname}/uploads`, {extensions: ['.mp4', '.mp3', '.aif', '.aiff', '.wav', '.gif'], limit: 100, age: {seconds: 1000*10}});
}, 1000*60*5);

app.listen(PORT, () => console.log(`Server Started at ${PORT}`))
