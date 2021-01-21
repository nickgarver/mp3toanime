const fileUpload = require('express-fileupload');
const {FFMpegProgress} = require('ffmpeg-progress-wrapper');
const fs = require('fs')
const express = require('express');
var session = require('express-session')
var MongoDBStore = require('connect-mongodb-session')(session);
const app = express();
const mongoUri = 'mongodb+srv://internetboy:keyboardcat1234@mp3anime.z3d8y.mongodb.net/sessions?retryWrites=true&w=majority';
const { v4: uuidv4 } = require('uuid');
const PORT = process.env.PORT || 5000;

var store = new MongoDBStore({
  uri: mongoUri,
  collection: 'mp3anime'
});

// Catch errors
store.on('error', function(error) {
  console.log(error);
});

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

app.use(fileUpload());

if (!fs.existsSync(`${__dirname}/uploads`)){
    fs.mkdirSync(`${__dirname}/uploads`);
}

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
        console.log('ffmpeg end');
        req.session.progMsg = 'Your video is ready!';
        req.session.progAmt = 100;
        req.session.dlReady = true;
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

// do this when user is timed out
// app.get('/cleanup', (req, res) => {
//   switch (req.session.cleaned) {
//     case true:
//       console.log("cleaned");
//       res.send('cleaned');
//       break;
//     case false:
//       req.session.cleaned = true;
//       req.session.dlReady = false;
//       if (fs.existsSync(req.session.videoPath)) {
//         console.log("deleted video: " + req.session.videoPath );
//         fs.unlink(req.session.videoPath, (err) => {
//           if (err) {
//             console.error(err)
//             return
//           }
//         })
//       }
//       if (fs.existsSync(req.session.audioPath)) {
//         console.log("deleted audio: " + req.session.audioPath );
//         fs.unlink(req.session.audioPath, (err) => {
//           if (err) {
//             console.error(err)
//             return
//           }
//         })
//       }
//       // req.session.destroy(function(err) {
//       //   // cannot access session here
//       // })
//       console.log("dirty");
//       res.send('dirty');
//       break;
//     case undefined:
//       console.log('clean undefined');
//       res.send('clean undefined');
//       break;
//     default:
//       console.log('clean else');
//       res.send('clean else');
//   }
// });

app.get('/download', (req, res) => {
  if (fs.existsSync(req.session.videoPath) && req.session.dlReady) {
    res.download(req.session.videoPath, 'tempName.mp4', () => {
      fs.unlinkSync(req.session.videoPath);
    });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  //do this if i buy ssl ticket
  //app.set('trust proxy', 1) // trust first proxy
  //session.cookie.secure = true // serve secure cookies
}

app.listen(PORT, () => console.log(`Server Started at ${PORT}`));
