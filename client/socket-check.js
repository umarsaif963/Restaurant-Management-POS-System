const { io } = require('socket.io-client');

async function main() {
  const res = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'manager@restaurant.com', password: 'Manager@123' }),
  });
  const cookies = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
  const cookieHeader = cookies.map((c) => c.split(';')[0]).join('; ');
  const socket = io('http://localhost:4000', {
    path: '/socket.io',
    transports: ['websocket'],
    extraHeaders: { Cookie: cookieHeader },
  });
  socket.on('connect', () => console.log('SOCKET_CONNECTED'));
  socket.on('inventory:updated', (payload) => {
    console.log('EVENT inventory:updated ' + JSON.stringify(payload));
    socket.disconnect();
    process.exit(0);
  });
  socket.on('connect_error', (e) => console.log('CONNECT_ERROR ' + e.message));
  setTimeout(() => {
    console.log('TIMEOUT_NO_EVENT');
    process.exit(2);
  }, 25000);
}

main();