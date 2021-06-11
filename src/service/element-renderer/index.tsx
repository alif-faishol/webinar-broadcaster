import { Socket, ManagerOptions, SocketOptions } from 'socket.io-client';
import { AppState } from '../app/types';

declare const io: (
  opts?: Partial<ManagerOptions & SocketOptions> | undefined
) => Socket;

const elem = window.document.createElement('div');
window.document.body.appendChild(elem);
elem.textContent = 'ehe';
elem.textContent += typeof io;

const socket = io();
socket.on('item-changed', (state: AppState) => {
  console.log(state);
});
