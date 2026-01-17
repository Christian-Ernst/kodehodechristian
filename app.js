const audioElement = document.querySelector("#audio");
const fileInput = document.querySelector("#audioFile");
const bassCutoff = document.querySelector("#bassCutoff");
const midCenter = document.querySelector("#midCenter");
const trebleCutoff = document.querySelector("#trebleCutoff");
const bassValue = document.querySelector("#bassValue");
const midValue = document.querySelector("#midValue");
const trebleValue = document.querySelector("#trebleValue");
const canvas = document.querySelector("#visualiserCanvas");
const ctx = canvas.getContext("2d");

let audioContext;
let sourceNode;
let bassFilter;
let midFilter;
let trebleFilter;
let bassAnalyser;
let midAnalyser;
let trebleAnalyser;
let animationId;

const bands = [
  { name: "bass", color: "#4dd0ff", radius: 130 },
  { name: "mid", color: "#9b7bff", radius: 170 },
  { name: "treble", color: "#ff8bd1", radius: 210 },
];

const analyserConfig = {
  fftSize: 2048,
  smoothingTimeConstant: 0.85,
};

const createAnalyser = () => {
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = analyserConfig.fftSize;
  analyser.smoothingTimeConstant = analyserConfig.smoothingTimeConstant;
  return analyser;
};

const updateSliderLabel = (input, label) => {
  label.textContent = `${input.value} Hz`;
};

const ensureAudioContext = () => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }

  if (!sourceNode) {
    sourceNode = audioContext.createMediaElementSource(audioElement);

    bassFilter = audioContext.createBiquadFilter();
    bassFilter.type = "lowpass";

    midFilter = audioContext.createBiquadFilter();
    midFilter.type = "bandpass";
    midFilter.Q.value = 1.1;

    trebleFilter = audioContext.createBiquadFilter();
    trebleFilter.type = "highpass";

    bassAnalyser = createAnalyser();
    midAnalyser = createAnalyser();
    trebleAnalyser = createAnalyser();

    sourceNode.connect(bassFilter);
    sourceNode.connect(midFilter);
    sourceNode.connect(trebleFilter);

    bassFilter.connect(bassAnalyser);
    midFilter.connect(midAnalyser);
    trebleFilter.connect(trebleAnalyser);

    sourceNode.connect(audioContext.destination);
  }

  updateFilters();
};

const updateFilters = () => {
  if (!audioContext) {
    return;
  }

  bassFilter.frequency.value = Number(bassCutoff.value);
  midFilter.frequency.value = Number(midCenter.value);
  trebleFilter.frequency.value = Number(trebleCutoff.value);
};

const drawWave = (analyser, color, radius, strength = 60) => {
  const bufferLength = analyser.fftSize;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteTimeDomainData(dataArray);

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();

  for (let i = 0; i < bufferLength; i += 4) {
    const angle = (i / bufferLength) * Math.PI * 2;
    const amplitude = (dataArray[i] - 128) / 128;
    const offset = amplitude * strength;
    const x = canvas.width / 2 + Math.cos(angle) * (radius + offset);
    const y = canvas.height / 2 + Math.sin(angle) * (radius + offset);

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.closePath();
  ctx.stroke();
};

const render = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(11, 15, 25, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawWave(bassAnalyser, bands[0].color, bands[0].radius, 70);
  drawWave(midAnalyser, bands[1].color, bands[1].radius, 55);
  drawWave(trebleAnalyser, bands[2].color, bands[2].radius, 45);

  animationId = requestAnimationFrame(render);
};

const startVisualizer = () => {
  ensureAudioContext();

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  if (!animationId) {
    render();
  }
};

fileInput.addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (!file) {
    return;
  }

  const url = URL.createObjectURL(file);
  audioElement.src = url;
  audioElement.play();
  startVisualizer();
});

[bassCutoff, midCenter, trebleCutoff].forEach((input) => {
  input.addEventListener("input", () => {
    updateFilters();
    updateSliderLabel(bassCutoff, bassValue);
    updateSliderLabel(midCenter, midValue);
    updateSliderLabel(trebleCutoff, trebleValue);
  });
});

[audioElement, fileInput].forEach((target) => {
  target.addEventListener("play", startVisualizer);
});

updateSliderLabel(bassCutoff, bassValue);
updateSliderLabel(midCenter, midValue);
updateSliderLabel(trebleCutoff, trebleValue);
