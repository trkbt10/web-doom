import { WadFile } from '@web-doom/wad-viewer';

const uploadArea = document.getElementById('uploadArea')!;
const fileInput = document.getElementById('fileInput') as HTMLInputElement;
const info = document.getElementById('info')!;
const lumpList = document.getElementById('lumpList')!;

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

async function loadWadFile(file: File): Promise<void> {
  try {
    const buffer = await file.arrayBuffer();
    const wad = new WadFile(buffer);

    info.style.display = 'block';
    info.innerHTML = `
      <h2>WAD Information</h2>
      <p><strong>File:</strong> ${file.name}</p>
      <p><strong>Type:</strong> ${wad.header.type}</p>
      <p><strong>Size:</strong> ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB</p>
      <p><strong>Lumps:</strong> ${wad.header.numLumps}</p>
    `;

    lumpList.style.display = 'block';
    lumpList.innerHTML = '<h2>Lumps</h2>';

    wad.lumps.forEach((lump, index) => {
      const div = document.createElement('div');
      div.className = 'lump-item';
      div.textContent = `${index.toString().padStart(4, '0')} - ${lump.name.padEnd(8)} (${lump.size} bytes)`;
      lumpList.appendChild(div);
    });
  } catch (error) {
    alert('Error loading WAD file: ' + error);
  }
}
