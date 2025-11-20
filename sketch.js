const bgCanvas = document.getElementById('background-canvas');
const bgCtx = bgCanvas.getContext('2d');
const playPauseBtn = document.getElementById('play-pause-btn');
const btnIcon = playPauseBtn.querySelector('span');
const audioElement = document.getElementById('audio-element');

let isPlaying = false;
let audioContext, analyser, mainGain, bufferLength, dataArray;
let stars = [];
const numStars = 1500;
const starColors = ['#ff00c1', '#00f2ff', '#a951f6', '#ffffff'];
const scheduleAheadTime = 0.1;

setupBackground();
drawBackground();
updateButton();

playPauseBtn.addEventListener('click', togglePlay);
window.addEventListener('resize', setupBackground);

function setupBackground() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    stars = [];
    for (let i = 0; i < numStars; i++) {
        stars.push({
            x: (Math.random() - 0.5) * bgCanvas.width,
            y: (Math.random() - 0.5) * bgCanvas.height,
            z: Math.random() * bgCanvas.width,
            size: Math.random() * 2 + 1,
            color: starColors[Math.floor(Math.random() * starColors.length)]
        });
    }
}

function drawBackground() {
    bgCtx.fillStyle = '#0a0a23';
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
    
    bgCtx.save();
    bgCtx.translate(bgCanvas.width / 2, bgCanvas.height / 2);

    for (let i = 0; i < numStars; i++) {
        let star = stars[i];
        star.z -= 1;
        if (star.z <= 0) {
            star.x = (Math.random() - 0.5) * bgCanvas.width;
            star.y = (Math.random() - 0.5) * bgCanvas.height;
            star.z = bgCanvas.width;
        }
        let k = 128.0 / star.z;
        let px = star.x * k;
        let py = star.y * k;
        bgCtx.fillStyle = star.color;
        bgCtx.beginPath();
        bgCtx.arc(px, py, star.size * k / 2, 0, Math.PI * 2);
        bgCtx.fill();
    }

    if (isPlaying && dataArray) {
        const bass = dataArray.slice(0, bufferLength / 4).reduce((a, b) => a + b, 0) / (bufferLength / 4);
        bgCtx.beginPath();
        const radius = 50 + bass * 0.75;
        const gradient = bgCtx.createRadialGradient(0, 0, 0, 0, 0, radius);
        gradient.addColorStop(0, 'rgba(255, 0, 193, 0.3)');
        gradient.addColorStop(0.8, 'rgba(255, 0, 193, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 0, 193, 0)');
        bgCtx.fillStyle = gradient;
        bgCtx.arc(0, 0, radius * 2, 0, Math.PI * 2);
        bgCtx.fill();

        bgCtx.strokeStyle = '#00f2ff';
        bgCtx.lineWidth = 1 + (dataArray.reduce((a,b) => a+b, 0) / bufferLength) / 50;
        bgCtx.beginPath();
        for (let i = 0; i < bufferLength; i++) {
            const angle = (i / bufferLength) * Math.PI * 2 - Math.PI / 2;
            const length = 100 + dataArray[i] * 0.75;
            const x1 = Math.cos(angle) * 100;
            const y1 = Math.sin(angle) * 100;
            const x2 = Math.cos(angle) * length;
            const y2 = Math.sin(angle) * length;
            bgCtx.moveTo(x1, y1);
            bgCtx.lineTo(x2, y2);
        }
        bgCtx.stroke();
    }

    bgCtx.restore();
    requestAnimationFrame(drawBackground);
}

function setupAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    mainGain = audioContext.createGain();
    mainGain.gain.value = 0.8;
    const source = audioContext.createMediaElementSource(audioElement);
    source.connect(mainGain);
    mainGain.connect(analyser);
    analyser.connect(audioContext.destination);
}

function gameLoop() {
    if (!isPlaying) return;

    analyser.getByteFrequencyData(dataArray);
    requestAnimationFrame(gameLoop);
}

function togglePlay() {
    isPlaying = !isPlaying;

    if (isPlaying) {
        if (!audioContext) {
            setupAudio();
        }
        audioContext.resume().then(() => {
            audioElement.play();
            gameLoop();
        });
    } else {
        audioElement.pause();
    }

    document.body.classList.toggle('playing', isPlaying);
    updateButton();
}
        
function updateButton() {
    btnIcon.className = isPlaying ? 'pause-icon' : 'play-icon';
}