import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import { Match, Sport, ServerToClientEvents, ClientToServerEvents } from './src/types';

const db = new Database('scoreboard.db');

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sport TEXT NOT NULL,
    teamA TEXT NOT NULL,
    teamB TEXT NOT NULL,
    scoreA INTEGER DEFAULT 0,
    scoreB INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Live',
    startTime TEXT NOT NULL
  )
`);

// Ensure newer columns exist for existing databases
try { db.exec("ALTER TABLE matches ADD COLUMN period TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE matches ADD COLUMN finishTime TEXT"); } catch (e) {}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer);

  const PORT = 3000;

  // Socket.io logic
  io.on('connection', (socket) => {
    console.log('User connected');

    // Send initial state
    try {
      const matches = db.prepare('SELECT * FROM matches').all() as Match[];
      socket.emit('matches:init', matches);
    } catch (error) {
      console.error('Error fetching initial matches:', error);
    }

    socket.on('match:create', ({ sport, teamA, teamB }) => {
      try {
        const startTime = new Date().toISOString();
        let initialPeriod = '1st Half';
        
        switch (sport) {
          case 'Basketball': initialPeriod = 'Q1'; break;
          case 'Volleyball': initialPeriod = 'Set 1'; break;
          case 'Cricket': initialPeriod = '1st Innings'; break;
          case 'Badminton': initialPeriod = 'Set 1'; break;
          case 'Table Tennis': initialPeriod = 'Set 1'; break;
          default: initialPeriod = '1st Half';
        }

        const info = db.prepare('INSERT INTO matches (sport, teamA, teamB, period, startTime) VALUES (?, ?, ?, ?, ?)').run(sport, teamA, teamB, initialPeriod, startTime);
        const newMatch: Match = {
          id: info.lastInsertRowid as number,
          sport,
          teamA,
          teamB,
          scoreA: 0,
          scoreB: 0,
          status: 'Live',
          period: initialPeriod,
          startTime
        };
        io.emit('match:created', newMatch);
        console.log(`Match created: ${sport} - ${teamA} vs ${teamB}`);
      } catch (error) {
        console.error('Error creating match:', error);
      }
    });

    socket.on('match:updateScore', ({ id, team, delta }) => {
      try {
        const column = team === 'A' ? 'scoreA' : 'scoreB';
        db.prepare(`UPDATE matches SET ${column} = ${column} + ? WHERE id = ?`).run(delta, id);
        const updatedMatch = db.prepare('SELECT * FROM matches WHERE id = ?').get(id) as Match;
        if (updatedMatch) {
          io.emit('match:updated', updatedMatch);
        }
      } catch (error) {
        console.error('Error updating score:', error);
      }
    });

    socket.on('match:updatePeriod', ({ id, period }) => {
      try {
        db.prepare('UPDATE matches SET period = ? WHERE id = ?').run(period, id);
        const updatedMatch = db.prepare('SELECT * FROM matches WHERE id = ?').get(id) as Match;
        if (updatedMatch) {
          io.emit('match:updated', updatedMatch);
        }
      } catch (error) {
        console.error('Error updating period:', error);
      }
    });

    socket.on('match:finish', (id) => {
      try {
        const finishTime = new Date().toISOString();
        db.prepare("UPDATE matches SET status = 'Finished', finishTime = ? WHERE id = ?").run(finishTime, id);
        const updatedMatch = db.prepare('SELECT * FROM matches WHERE id = ?').get(id) as Match;
        if (updatedMatch) {
          io.emit('match:updated', updatedMatch);
          console.log(`Match finished: ${id}`);
        }
      } catch (error) {
        console.error('Error finishing match:', error);
      }
    });

    socket.on('match:delete', (id) => {
      try {
        db.prepare('DELETE FROM matches WHERE id = ?').run(id);
        io.emit('match:deleted', id);
        console.log(`Match deleted: ${id}`);
      } catch (error) {
        console.error('Error deleting match:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
