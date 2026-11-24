import { supabase } from './supabaseClient.js';
import { toast } from './ui.js';

const BUCKET = 'profile-images';
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 8 * 1024 * 1024;
const SIZES = { avatar: { width: 400, height: 400 }, cover: { width: 1280, height: 720 } };

function checkFile(file) {
  if (!TYPES.includes(file.type)) return 'Use a JPG, PNG or WebP image.';
  if (file.size > MAX_BYTES) return 'That image is too large. Keep it under 8 MB.';
  return '';
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file could not be read as an image.')); };
    img.src = url;
  });
}

async function prepareImage(file, { width, height }) {
  const problem = checkFile(file);
  if (problem) throw new Error(problem);
  const img = await loadImage(file);
  const scale = Math.max(width / img.width, height / img.height);
  const sw = width / scale, sh = height / scale;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, width, height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not process that image.'))), 'image/jpeg', 0.86));
}

export async function uploadProfileImage(userId, file, kind) {
  const blob = await prepareImage(file, SIZES[kind]);
  const path = `${userId}/${kind}-${Date.now()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
  if (error) throw new Error(error.message);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function pathFromUrl(url) {
  const marker = `/${BUCKET}/`;
  const i = String(url || '').indexOf(marker);
  return i < 0 ? null : decodeURIComponent(url.slice(i + marker.length).split('?')[0]);
}

export async function removeImageByUrl(url) {
  const path = pathFromUrl(url);
  if (path) await supabase.storage.from(BUCKET).remove([path]);
}

export async function removeAllUserImages(userId) {
  const { data } = await supabase.storage.from(BUCKET).list(userId);
  if (data && data.length) await supabase.storage.from(BUCKET).remove(data.map((f) => `${userId}/${f.name}`));
}

export function initUploaders(root = document) {
  root.querySelectorAll('.uploader').forEach((el) => {
    const input = el.querySelector('input[type=file]');
    const box = el.querySelector('.u-box');
    const img = el.querySelector('.u-preview');
    const empty = el.querySelector('.u-empty');
    const pick = el.querySelector('.u-pick');
    const remove = el.querySelector('.u-remove');
    const state = { file: null, removed: false, url: '', preview: '' };
    el._state = state;

    const refresh = () => {
      const src = state.file ? state.preview : (!state.removed && state.url ? state.url : '');
      img.hidden = !src;
      if (src) img.src = src; else img.removeAttribute('src');
      empty.hidden = !!src;
      remove.hidden = !src;
      box.classList.toggle('has', !!src);
      pick.textContent = src ? 'Change image' : 'Choose image';
    };
    el._refresh = refresh;

    pick.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
      const file = input.files[0];
      input.value = '';
      if (!file) return;
      const problem = checkFile(file);
      if (problem) return toast(problem, 'err');
      if (state.preview) URL.revokeObjectURL(state.preview);
      state.file = file;
      state.removed = false;
      state.preview = URL.createObjectURL(file);
      refresh();
    });
    remove.addEventListener('click', () => {
      if (state.file) {
        URL.revokeObjectURL(state.preview);
        state.file = null;
        state.preview = '';
      } else {
        state.removed = true;
      }
      refresh();
    });
    refresh();
  });
}

const find = (root, kind) => root.querySelector(`.uploader[data-kind="${kind}"]`);

export function getUploader(root, kind) {
  const s = find(root, kind)._state;
  return { file: s.file, removed: s.removed };
}

export function showUploader(root, kind, url) {
  const el = find(root, kind);
  const s = el._state;
  if (s.preview) URL.revokeObjectURL(s.preview);
  Object.assign(s, { file: null, removed: false, url: url || '', preview: '' });
  el._refresh();
}

export function clearUploaders(root) {
  root.querySelectorAll('.uploader').forEach((el) => showUploader(root, el.dataset.kind, ''));
}
