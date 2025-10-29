import { DoomEngine } from '@web-doom/core';

const uploadArea = document.getElementById('uploadArea')!;
const fileInput = document.getElementById('fileInput') as HTMLInputElement;
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const controls = document.getElementById('controls')!;
const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
const stopBtn = document.getElementById('stopBtn') as HTMLButtonElement;

let engine: DoomEngine | null = null;

uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.style.background = '#111';
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.style.background = '';
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.style.background = '';
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    loadWadFile(files[0]);
  }
});

fileInput.addEventListener('change', () => {
  const files = fileInput.files;
  if (files && files.length > 0) {
    loadWadFile(files[0]);
  }
});

startBtn.addEventListener('click', () => {
  if (engine) {
    engine.start();
    startBtn.disabled = true;
    stopBtn.disabled = false;
  }
});

stopBtn.addEventListener('click', () => {
  if (engine) {
    engine.stop();
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
});

async function loadWadFile(file: File): Promise<void> {
  try {
    const buffer = await file.arrayBuffer();

    engine = new DoomEngine({
      canvas,
      wadFile: buffer
    });

    engine.init();

    uploadArea.style.display = 'none';
    canvas.style.display = 'block';
    controls.style.display = 'block';

    // Scale canvas for better visibility
    const scale = 3;
    canvas.style.width = `${canvas.width * scale}px`;
    canvas.style.height = `${canvas.height * scale}px`;
  } catch (error) {
    alert('Error loading WAD file: ' + error);
  }
}
