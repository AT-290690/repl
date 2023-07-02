import lisper from 'node-lisper';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const { parse, run, std } = lisper;
const PORT = process.env.PORT ?? 8182;
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use('/', express.static(join(__dirname, 'public')));
io.on('connection', socket => {
  socket.on('eval', input => {
    let env = {};
    try {
      let out = `${std}\n(block ${input})`;
      const result = run(parse(out), env);
      if (typeof result === 'function') {
      } else if (Array.isArray(result)) {
        socket.emit(
          'eval',
          JSON.stringify(result)
            .replace(new RegExp(/\[/g), '(')
            .replace(new RegExp(/\]/g), ')')
            .replace(new RegExp(/\,/g), ' ')
        );
      } else if (typeof result === 'string') {
        socket.emit('eval', `"${result}"`);
      } else if (result == undefined) {
      } else {
        socket.emit('eval', JSON.stringify(result));
      }
    } catch (err) {
      socket.emit('eval', err.message);
    }
  });
  socket.on('disconnect', () => {});
});
server.listen(PORT, () => console.log(`listening on *:${PORT}`));
