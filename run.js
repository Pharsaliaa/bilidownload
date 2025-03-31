import axios from "axios";
import readline from "readline";
import fs from 'fs';
import ProgressBar from 'progress';
import { exec } from 'child_process'


const title = `
 ███████████  ███ ████  ███ ███████████  ███ ████  ███     ███████████ █████   █████                
░░███░░░░░███░░░ ░░███ ░░░ ░░███░░░░░███░░░ ░░███ ░░░     ░█░░░███░░░█░░███   ░░███                 
 ░███    ░███████ ░███ ████ ░███    ░███████ ░███ ████    ░   ░███  ░  ░███    ░███                 
 ░██████████░░███ ░███░░███ ░██████████░░███ ░███░░███        ░███     ░███    ░███                 
 ░███░░░░░███░███ ░███ ░███ ░███░░░░░███░███ ░███ ░███        ░███     ░░███   ███                  
 ░███    ░███░███ ░███ ░███ ░███    ░███░███ ░███ ░███        ░███      ░░░█████░                   
 ███████████ ██████████████████████████ ███████████████       █████       ░░███                     
░░░░░░░░░░░ ░░░░░░░░░░░░░░░░░░░░░░░░░░ ░░░░░░░░░░░░░░░       ░░░░░         ░░░                      
                                                                                                    
 ██████████                                     ████                        █████                   
░░███░░░░███                                   ░░███                       ░░███                    
 ░███   ░░███  ██████  █████ ███ █████████████  ░███   ██████  ██████    ███████   ██████  ████████ 
 ░███    ░███ ███░░███░░███ ░███░░███░░███░░███ ░███  ███░░███░░░░░███  ███░░███  ███░░███░░███░░███
 ░███    ░███░███ ░███ ░███ ░███ ░███ ░███ ░███ ░███ ░███ ░███ ███████ ░███ ░███ ░███████  ░███ ░░░ 
 ░███    ███ ░███ ░███ ░░███████████  ░███ ░███ ░███ ░███ ░██████░░███ ░███ ░███ ░███░░░   ░███     
 ██████████  ░░██████   ░░████░████   ████ ██████████░░██████░░████████░░████████░░██████  █████    
░░░░░░░░░░    ░░░░░░     ░░░░ ░░░░   ░░░░ ░░░░░░░░░░  ░░░░░░  ░░░░░░░░  ░░░░░░░░  ░░░░░░  ░░░░░     
                                                                                                    
`;

const resolutionMap = {
    '360': 16,
    '480': 32,
    '720': 64,
    '1080': 80,
    '1080+': 112,
};

const loadCookiesFromFile = (filePath) => {
    try {
        const data = fs.readFileSync(filePath, 'utf-8');
        const cookiesArray = data.split('\n').map(line => line.trim()).filter(line => line);

        return cookiesArray.join('; ');
    } catch (error) {
        console.error(`Error loading cookies: ${error.message}`);
        return '';
    }
};

const cookies = loadCookiesFromFile('./cookies.txt');

axios.defaults.headers = {
    referer: 'https://www.bilibili.tv/',
    cookie: cookies,
};

const getValueAfterVideo = (link) => {
    const parsedUrl = new URL(link);
    const pathSplit = parsedUrl.pathname.split('/');

    if (link.includes('/video/')) {
        const videoIndex = pathSplit.indexOf('video');
        return pathSplit[videoIndex + 1];
    } else if (link.includes('/play/')) {
        const numbersAfterPlay = pathSplit.filter(segment => /^\d+$/.test(segment));

        if (numbersAfterPlay.length >= 2) {
            return numbersAfterPlay[1];
        } else if (numbersAfterPlay.length === 1) {
            console.log('Only one number found after /play/. That value will be used.');
            return numbersAfterPlay[0];
        } else {
            console.log('Not enough numbers found after /play/');
            return null;
        }
    } else {
        console.log('Unsupported link type.');
        return null;
    }
};

const getVideoAndAudioUrl = async (value, desiredVideoQuality, desiredQuality = 64) => {
    const regexVideo = /^\d{4,8}$/;
    if (value) {
    let apiUrl;

    if (regexVideo.test(value)) {
        apiUrl = `https://api.bilibili.tv/intl/gateway/web/playurl?ep_id=${value}&device=wap&platform=web&qn=64&tf=0&type=0`;
    } else {
        apiUrl = `https://api.bilibili.tv/intl/gateway/web/playurl?s_locale=en_US&platform=web&aid=${value}&qn=120`;
    }

    try {
        const response = await axios.get(apiUrl, { credentials: "include" });
    const data = response.data;


    
    if (!data || !data.data || !data.data.playurl) {
        console.log('Server response does not contain the expected structure.');
        return null;
    }
    
    let videoUrl = null;
    let audioUrl = null;
    
    for (const videoInfo of data.data.playurl.video) {
        const videoResource = videoInfo.video_resource || {};
        const streamInfo = videoInfo.stream_info || {};
        const videoQuality = streamInfo.quality || 112;
        
        if (videoQuality === desiredVideoQuality) {
            if(videoQuality === 112){
                console.log(`Resolution: 1080P(HD)`);
            }else if(videoQuality === 80){
                console.log(`Resolution: 1080P`);
            }else if(videoQuality === 64){
                console.log(`Resolution: 720P`);
            }else if(videoQuality === 32){
                console.log(`Resolution: 480P`);
            }else if(videoQuality === 16){
                console.log(`Resolution: 360P`);
            }
    console.log(data.data.playurl.video.video_resource.url);

            // videoUrl = videoResource.url || '';
            break;
        } else if (videoQuality < desiredVideoQuality) {
        // If desired quality not found, pick the closest lower quality
            if(videoQuality === 112){
                console.log(`Resolution: 1080P(HD)`);
            }else if(videoQuality === 80){
                console.log(`Resolution: 1080P`);
            }else if(videoQuality === 64){
                console.log(`Resolution: 720P`);
            }else if(videoQuality === 32){
                console.log(`Resolution: 480P`);
            }else if(videoQuality === 16){
                console.log(`Resolution: 360P`);
            }
            videoUrl = videoResource.url || '';
            break;
        }
    }

            const audioInfoList = data.data.playurl.audio_resource || [];

            if (audioInfoList.length > 0) {
                const audioInfo = audioInfoList[0]; 
                const audioQuality = audioInfo.quality || 0;
                audioUrl = audioQuality >= desiredQuality ? audioInfo.url || '' : null;
            }
            
            if (videoUrl !== null && audioUrl !== null) {
                return { videoUrl, audioUrl };
            } else {
                console.log(`URL for video or audio with quality ${desiredQuality} or 64 not found..`);
                return null;
            }
        } catch (error) {
            console.log(`Error getting video and audio URL: ${error.message}`);
            return null;
        }
    } else {
        console.log('No value provided after /video/ or /play/');
        return null;
    }
};

const getSubtitles = async (value, subtitle = 'id') => {
    const regexVideo = /^\d{4,8}$/;
    if (value) {
    let apiUrl;

    if (regexVideo.test(value)) {
        apiUrl = `https://api.bilibili.tv/intl/gateway/web/v2/subtitle?s_locale=id_ID&platform=web&episode_id=${value}`;
    } 

    try {
        const response = await axios.get(apiUrl, { credentials: "include" });
        const data = response.data;

    
        if (!data || !data.data || !data.data.video_subtitle) {
            console.log('Server response does not contain the expected structure.');
            return null;
        }
    
    let subtitleUrl = null;
    
    for (const subtitleInfo of data.data.video_subtitle) {
        const subtitleLang = subtitleInfo.lang || "";
        const languageKey = subtitleInfo.lang_key || 'id';
        
        if (languageKey === subtitle) {
            console.log(`Subtitle Found!\n${subtitleLang}`)
            subtitleUrl = subtitleInfo.srt.url || '';
            break;
        }
    }

    if (subtitleUrl !== null) {
        return { subtitleUrl };
    } else {
        console.log(`Error getting Subtitle URL: ${error.message}`);
        return null;
    }
        } catch (error) {
            console.log(`Error getting Subtitle URL: ${error.message}`);
            return null;
        }
    } else {
        console.log('No value provided after /video/ or /play/');
        return null;
    }
};

const downloadVideoAndAudio = async (link, destinationDirectory = '.', desiredVideoQuality) => {
    const valueAfterVideo = getValueAfterVideo(link);
  
    if (valueAfterVideo) {
      const { videoUrl, audioUrl } = await getVideoAndAudioUrl(valueAfterVideo, desiredVideoQuality);
      const { subtitleUrl } = await getSubtitles(valueAfterVideo);
      if (videoUrl && audioUrl && subtitleUrl) {
        console.log('Links found!');
  
        const videoFileName = `${destinationDirectory}/${Math.floor(Math.random() * 1000000)}_video.m4v`;
        const audioFileName = `${destinationDirectory}/${Math.floor(Math.random() * 1000000)}_audio.mp4`;
        const subtitleFileName = `${destinationDirectory}/${Math.floor(Math.random() * 1000000)}_subtitles.json`;
  
        await downloadFile(videoUrl, videoFileName);
        await downloadFile(audioUrl, audioFileName);
        await downloadFile(subtitleUrl, subtitleFileName);
  
        const finalFileName = `${destinationDirectory}/${Math.floor(Math.random() * 1000000)}_final.mp4`;
        const ffmpegCommand = `ffmpeg -i ${videoFileName} -i ${audioFileName} -vcodec copy -acodec copy -f mp4 ${finalFileName}`;
        await executeShellCommand(ffmpegCommand);
  
        console.log(`Files linked as: ${finalFileName} \n`);
  
        await deleteFile(videoFileName);
        await deleteFile(audioFileName);
  
        console.log('Video and audio files deleted.');
      } else {
        console.log('URL for the desired quality not found.');
      }
    } else {
      console.log('Link does not contain the expected "video/" or "play/" part.');
    }
  };

const downloadFile = async (fileUrl, fileName) => {
    try {
        const response = await axios.get(fileUrl, { responseType: 'stream' });

        const totalBytes = parseInt(response.headers['content-length'], 10);
        let receivedBytes = 0;
        let lastReceivedBytes = 0;

        const bar = new ProgressBar(`Downloading ${fileName} [:bar] :percent :etas`, {
            complete: '=',
            incomplete: ' ',
            width: 20,
            total: totalBytes
        });

        const writableStream = fs.createWriteStream(fileName);

        response.data.on('data', (chunk) => {
            receivedBytes += chunk.length;
            bar.tick(chunk.length); 
            lastReceivedBytes = receivedBytes;
        });

        response.data.pipe(writableStream);

        await new Promise((resolve, reject) => {
            writableStream.on('finish', resolve);
            writableStream.on('error', reject);
        });

        console.log(`File downloaded as:  ${fileName} \n`);
        return fileName;
    } catch (error) {
        console.error(`Error during file download:  ${error.message}`);
        return null;
    }
};

const deleteFile = async (fileName) => {
    try {
        await fs.promises.unlink(fileName);
    } catch (error) {
        console.log(`Error deleting file ${fileName}: ${error}`);
    }
};

const executeShellCommand = async (command) => {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command: ${error.message}`);
                reject(error);
            } else {
                resolve(stdout);
            }
        });
    });
};
            
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log(title); 
console.log('                                    https://gitlab.com/aldyrp \n \n');

console.log('Input Url Below that includes Season ID & Episode ID (e.g https://www.bilibili.tv/id/play/2105997/13457060?bstar_from=bstar-web.pgc-video-detail.episode.all)'); 
rl.question('Bilibili URL: ', (originalLink) => {
    
    const valueAfterVideo = getValueAfterVideo(originalLink);

    const destinationDirectory = './Downloads';

    if (!fs.existsSync(destinationDirectory)) {
        fs.mkdirSync(destinationDirectory);
    }

    rl.question('Enter the folder name: ', async (folderName) => {

        const folderPath = './Downloads/' + folderName.replace(/\s+/g, '_');
      
        fs.mkdir(folderPath, (err) => {
          if (err) {
            console.error('Error creating folder:', err);
          } else {
            console.log('Folder created successfully!');
            rl.question('Select desired video resolution (1080+, 1080, 720, 480, 360): ', (userInput) => {
                const desiredVideoQuality = resolutionMap[userInput.toLowerCase()];
        
                if (!desiredVideoQuality) {
                    console.log("Invalid resolution. Please enter a valid resolution (1080+, 1080, 720, 480, or 360).");
                    return;
                }
        
                getVideoAndAudioUrl(valueAfterVideo, desiredVideoQuality);
                const executeDownload = async () => {
                    getSubtitles(valueAfterVideo)
                    if (valueAfterVideo) {
                        const videoUrl = await getVideoAndAudioUrl(valueAfterVideo, desiredVideoQuality);
                        if (videoUrl) {
                            await downloadVideoAndAudio(originalLink, folderPath, desiredVideoQuality);
                        } else {
                            console.log('URL not found for desired quality.');
                        }
                    } else {
                        console.log('The link does not contain the expected "video/" part.');
                    }
                };
            
                executeDownload();
                rl.close();
            });
          }
        });
    });

    
});            