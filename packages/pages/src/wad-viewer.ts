import { decode, validate, printStructure, getMetadata, getStatistics } from '@web-doom/wad';

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
    const wad = decode(buffer);

    // Validate WAD file
    const validation = validate(wad);
    const metadata = getMetadata(wad);
    const stats = getStatistics(wad);

    // Display info
    info.style.display = 'block';
    let infoHtml = `
      <h2>WAD Information</h2>
      <p><strong>File:</strong> ${file.name}</p>
      <p><strong>Type:</strong> ${metadata.type}</p>
      <p><strong>Size:</strong> ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB</p>
      <p><strong>Lumps:</strong> ${metadata.lumpCount}</p>
      <p><strong>Data Size:</strong> ${stats['Data Size']}</p>
      <p><strong>Valid:</strong> ${validation.valid ? '✓ Yes' : '✗ No'}</p>
    `;

    if (!validation.valid) {
      infoHtml += '<h3 style="color: #f00;">Errors:</h3><ul>';
      validation.errors.forEach((error) => {
        infoHtml += `<li>${error}</li>`;
      });
      infoHtml += '</ul>';
    }

    if (validation.warnings.length > 0) {
      infoHtml += '<h3 style="color: #ff0;">Warnings:</h3><ul>';
      validation.warnings.forEach((warning) => {
        infoHtml += `<li>${warning}</li>`;
      });
      infoHtml += '</ul>';
    }

    info.innerHTML = infoHtml;

    // Display lumps
    lumpList.style.display = 'block';
    lumpList.innerHTML = '<h2>Lumps</h2>';

    wad.lumps.forEach((lump, index) => {
      const div = document.createElement('div');
      div.className = 'lump-item';
      const sizeStr = lump.size === 0 ? 'marker' : `${lump.size} bytes`;
      div.textContent = `${index.toString().padStart(4, '0')} - ${lump.name.padEnd(8)} (${sizeStr})`;
      lumpList.appendChild(div);
    });

    // Log structure to console
    console.log(printStructure(wad));
  } catch (error) {
    alert('Error loading WAD file: ' + error);
    console.error(error);
  }
}
