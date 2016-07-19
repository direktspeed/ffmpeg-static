"use strict";

const fs = require('fs');
const os = require('os');
const path = require('path');
const decompress = require('decompress');
const decompressTarxz = require('decompress-tarxz');
const url = require("url");
const Downloader = require('mt-files-downloader');
const glob = require("glob");
const rimraf = require('rimraf');

// Download URLs
const urls = {
    linux: {
        ia32: "http://johnvansickle.com/ffmpeg/builds/ffmpeg-git-32bit-static.tar.xz",
        x64: "http://johnvansickle.com/ffmpeg/builds/ffmpeg-git-64bit-static.tar.xz"
    },
    win32: {
        ia32: "https://ffmpeg.zeranoe.com/builds/win32/static/ffmpeg-latest-win32-static.zip",
        x64: "https://ffmpeg.zeranoe.com/builds/win64/static/ffmpeg-latest-win64-static.zip"
    }
};

const platform = os.platform();
const arch = os.arch();
const downloadLink = urls[platform][arch];
const archiveFilename = path.basename(url.parse(downloadLink).pathname);
const archive = path.join(os.tmpdir(), archiveFilename);
const archiveDirectory = path.join(os.tmpdir(), 'ffmpeg');

if (platform !== 'linux' && platform !== 'win32') {
    console.log('No git version avaliable for', platform);
    process.exit(0);
}

// console.log('Downloading latest git build.');

var downloader = new Downloader();
var dl = downloader.download(downloadLink, archive);

dl.on('start', function() {
    console.log('Downloading', downloadLink, 'to', archive);
}).on('end', function() {
    // console.log(archiveFilename, 'downloaded successfully.');
    console.log('Extracting', archiveFilename);

    if (path.extname(archiveFilename) === '.xz') {

        decompress(archive, archiveDirectory, {
                plugins: [
                    decompressTarxz()
                ]
            }).then(() => {
                moveFile();
            })
            .catch(function(err) {
                console.error(err);
                process.exit(1);
            });

    }
    else if (path.extname(archiveFilename) === '.zip') {
        
    }


}).on('error', function() {
    console.error(dl.error);
    process.exit(1);
});

dl.start();

const ffmpegPath = path.join(
    __dirname,
    '../bin',
    platform,
    arch,
    platform === 'win32' ? 'ffmpeg-git.exe' : 'ffmpeg-git'
);

function moveFile() {
    let filename;
    if (platform === 'win32')
        filename = "ffmpeg.exe";
    else
        filename = "ffmpeg";

    glob(archiveDirectory + "/**/" + filename, function(err, files) {
        if (err) {
            throw err;
        }
        
        fs.renameSync(files[0], ffmpegPath);
        removeTempFiles();
    });
}

function removeTempFiles() {
        rimraf(archiveDirectory, function() {
            fs.unlinkSync(archive);
        });
}