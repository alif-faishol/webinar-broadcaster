import io from 'socket.io-client';
import { AppState } from '../app/types';

const elem = window.document.createElement('div');
window.document.body.appendChild(elem);
elem.textContent = 'woiii';
elem.textContent += typeof io;

const socket = io();
socket.on('item-changed', (state: AppState) => {
  console.log(state);
});
