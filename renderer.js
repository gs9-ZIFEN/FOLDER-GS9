const themeToggle = document.getElementById('theme-toggle');
const grid = document.getElementById('grid');
const color1 = document.getElementById('color1');
const color2 = document.getElementById('color2');

const savedC1 = localStorage.getItem('custom-c1');
const savedC2 = localStorage.getItem('custom-c2');

color1.value = savedC1 || '#00f2fe';
color2.value = savedC2 || '#f093fb';

if (savedC1) document.documentElement.style.setProperty('--c1', savedC1);
if (savedC2) document.documentElement.style.setProperty('--c2', savedC2);

color1.addEventListener('input', (e) => {
  document.documentElement.style.setProperty('--c1', e.target.value);
  localStorage.setItem('custom-c1', e.target.value);
});

color2.addEventListener('input', (e) => {
  document.documentElement.style.setProperty('--c2', e.target.value);
  localStorage.setItem('custom-c2', e.target.value);
});

const sunIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
const moonIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><defs><linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2c2c2c" /><stop offset="100%" stop-color="#141414" /></linearGradient><linearGradient id="strokeGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="rgba(255,255,255,0.15)" /><stop offset="100%" stop-color="rgba(255,255,255,0.02)" /></linearGradient></defs><rect width="64" height="64" rx="14" fill="url(#bgGrad)" stroke="url(#strokeGrad)" stroke-width="1.5"/><path d="M32 18 L44 32 L32 46 L20 32 Z" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" stroke-linejoin="round"/><circle cx="32" cy="32" r="2.5" fill="rgba(255,255,255,0.25)"/></svg>`;
const defaultIconSVG = `data:image/svg+xml;base64,${btoa(svgString)}`;

themeToggle.addEventListener('click', () => {
  const root = document.documentElement;
  const isDark = root.getAttribute('data-theme') === 'dark';
  themeToggle.classList.add('rotate');
  setTimeout(() => themeToggle.classList.remove('rotate'), 300);
  root.setAttribute('data-theme', isDark ? 'light' : 'dark');
  themeToggle.innerHTML = isDark ? moonIcon : sunIcon;
});

document.getElementById('minimize-btn').addEventListener('click', () => window.api.minimize());
document.getElementById('close-btn').addEventListener('click', () => window.api.close());

async function loadShortcuts() {
  grid.innerHTML = '';
  const files = await window.api.getShortcuts();
  
  const fragment = document.createDocumentFragment();
  
  files.forEach(file => {
    const el = document.createElement('div');
    el.className = 'shortcut';
    el.draggable = true;
    el.dataset.filename = file.filename;
    
    const imgSrc = file.icon === 'default' ? defaultIconSVG : file.icon;

    el.innerHTML = `
      <div class="delete-btn" data-path="${file.path.replace(/\\/g, '\\\\')}">✕</div>
      <img src="${imgSrc}" alt="icon" loading="lazy">
      <span>${file.name}</span>
    `;

    el.addEventListener('click', (e) => {
      if(e.target.classList.contains('delete-btn')) {
        e.stopPropagation();
        window.api.deleteShortcut(file.path);
        el.style.transform = 'scale(0)';
        setTimeout(() => el.remove(), 200);
      } else {
        window.api.openShortcut(file.path);
      }
    });

    el.addEventListener('dragstart', handleDragStart);
    el.addEventListener('dragover', handleDragOver);
    el.addEventListener('drop', handleDrop);
    el.addEventListener('dragend', handleDragEnd);

    fragment.appendChild(el);
  });

  grid.appendChild(fragment);
}

let draggedItem = null;

function handleDragStart(e) {
  draggedItem = this;
  setTimeout(() => this.classList.add('dragging'), 0);
}
function handleDragOver(e) { e.preventDefault(); }
function handleDrop(e) {
  e.preventDefault();
  if (this !== draggedItem) {
    let allItems = [...grid.querySelectorAll('.shortcut')];
    let draggedIdx = allItems.indexOf(draggedItem);
    let droppedIdx = allItems.indexOf(this);

    if (draggedIdx < droppedIdx) {
      this.after(draggedItem);
    } else {
      this.before(draggedItem);
    }
    const newLayout = [...grid.querySelectorAll('.shortcut')].map(el => el.dataset.filename);
    window.api.saveLayout(newLayout);
  }
}
function handleDragEnd() { this.classList.remove('dragging'); }

loadShortcuts();