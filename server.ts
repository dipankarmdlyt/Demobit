/**
 * Mossbit Express Backend with Built-in Vite Middleware & Synchronization Services
 * Built for zero key requirements and offline-to-online state alignment.
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const DB_FILE_PATH = path.join(process.cwd(), 'server-db.json');

// Middlewares
app.use(express.json({ limit: '10mb' }));

// Model definitions for sync structures
interface ServerSyncPayload {
  habits: any[];
  logs: Record<string, string>;
  isPremium: boolean;
  timestamp: number;
}

// Ensure server db file exists with basic template
function loadServerDB(): ServerSyncPayload {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const content = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('[Server DB] Read error, resetting:', err);
  }
  return {
    habits: [],
    logs: {},
    isPremium: false,
    timestamp: 0,
  };
}

function saveServerDB(data: ServerSyncPayload) {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Server DB] Write error:', err);
  }
}

/**
 * Bootstrap PWA static launcher PNG icons automatically at boot
 * if they aren't already present in the static files directory.
 */
function ensurePwaAssets() {
  try {
    const publicPath = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicPath)) {
      fs.mkdirSync(publicPath, { recursive: true });
    }

    const png192 = path.join(publicPath, 'icon-192.png');
    const png512 = path.join(publicPath, 'icon-512.png');

    const has192 = fs.existsSync(png192);
    const has512 = fs.existsSync(png512);

    if (!has192 || !has512) {
      console.log('[Server Bootstrap] Regenerating static PWA fallback PNG icons');
      // Compact moss-green image buffer representation
      const BASE64_PNG = 
        'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEBAQMAAABIm08DAAABhGlDQ1BJQ0MgcHJvZmlsZQAAKJF9' +
        'kT9IxFEYwX9/WiuUClpEtEkZ3DSIgkUoLbVSg9YgpeW9PMeS59vLe/eeYmuXcDLoImicFAdRcHZw' +
        'cHQShS6CgqCJDor2Xj6toZfMe8N7v8f3vXff++BgrRjGsh8GqJZpZpJxEasurIuDHyGgwAsIIdN0' +
        'K7OYTCbhePrZ62WfIviOPrWe7V/e74mX/A4EIBgM083MYTbwVGaF0H1msSgMhE4IlyM5Scy04Mww' +
        'b+LMWTHeRuw7RtxL9oPAt0e9x0pWeorK3VfSg+UksH6WjB9O0I0GgS09PZg6FALaLg3YyZ0Y8+b5' +
        'f7uW0YqV+A8jWk4R6LzD3m9p9Z9W8o/Xyid696mFvffM+7G/rUR/H9N6Tid/O7a0nvX5b6i7W/W1' +
        'b+hDoW18m8ZpI3KstXyK8/k9yXlXfUnbe00Z367L2bK7mHcoC5B+FPo/FzNOfN5cWzKOfWk69p3O' +
        'H0rY2R0k/8+L6a++8pXm+RveH7y+ef4Pvxz7BcoIexIAAAA4VYSVAcgAAAAnVYSVAsAAAAAnVYSV' +
        'AwAAAAAnVYSVAnAAAAAnU0SUmAdwAAAAEAAAACAAAABAAAAAgAAACGR6Y3AAAABlBMVEUAD7n///' +
        '8uLdlyAAAACHRSTlMAG/7+Gv7+BvxP6I01AAAAYklEQVR42u3PMQ0AAAgEsMe/ZgTDF0iBtpB0t9' +
        're66enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6' +
        'enp6enp6enp6enp6enp7ev9jUAAAD//7o70M8AAAFKSURBVPjV2T1Lw1AUxvH/SW69XpEODpIuDo' +
        'KDg6jgKjg6iIIDuIqKCOImOHRwcHBwcHBX/ByuCgXFpZNLvCqki2C7fKkg7eE89YND6VVSg8R+T9' +
        'pM7vAknEtyh9R+T9pM7vAknEtyh9R+T9pM7vAknEtyh9R+T9pM7vAknEtyh9R+T9pM7vAknEtyh9' +
        'R+T9pM7vAknEtyh9R+T9pM7vAknEtyh9R+T9pM7vAknEtyh9R+T9pM5v7eTeb8f26m8CucS3KH1H' +
        '5P2kzu8CScS3KH1H5P2kzu8CScS3KH1H5P2kzu8CScS3KH1H5P2kzu8CScS3KH1H5P2kzu8CScS3' +
        'KH1H5P2kzu8CScS3KH1H5P2kzu8CScS3KH1H5P2kzu8CScS3KH1H5P2kzu8CScS3KHeTeW7LmbS' +
        'XeT83VziXvFpS+z1ps7vDk9gTfOFTl3k/m9Sg0Se1R6ldR+T5rUHl9iU/p+T2pPn7YmK3eTuf+v' +
        'uy0AAAD//7uC+f8AAAEuSURBVPjV2T1OAzEURuH3SMyDskM62kiIjoSExEToSUCisRTIkEg0dEBEd' +
        'FQUNDQUFEgU6GgoKFDg6CgQEAnZp0OQ0p0h/UfREeWqfOVRvSpvEutI6UhpbSKeKloYmUhpTWJlIa' +
        'UlpE6UhpbSKloZGURpSWkdIaUlpGSpsoLSMlkpTWSf9CaiGlS/5XUpqKPy6lkYrXGSk9KZZZKTUpr' +
        'YxU7K6R0pTSuor/VNJbJT0ptZGKlUbW1khpZKS0it9mpNJUis0S/1fSpopbU7G+is0pWZsiXp9kXZ' +
        'rUKf0fSXv8J+T/XnZ/gPx3M/O6z9jP9g8j9m1E635O68GdfBfRuo9pXWbsuzv8M6v7iP1gZj6ZaW' +
        'ZmZvY/mZnD/7p9yXw6zP97y+M/Xf7ZAAAA///SVPgLAAABHUlEQVR42u3QMQEAAAzAsMn8mUfB8Am' +
        'YgL6S9A2FpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWl' +
        'paWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlbU+ZgAAAAD//+' +
        'yOtxEAAAMwyOznB8PwyYgJ6CtJv6GwtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS' +
        '0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS' +
        '0tLS0tLS0tLS0tLS0xIYHptf2/p/2FgAAAP//2oyXEQAAAy/IbOf9Zhg+GTEBfSXpNxSWlpaWlpa' +
        'WlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlsbE00AAAA//9SVPgLAA' +
        'ABHUlEQVR42u3QMQEAAAzAsMn8mUfB8AmYgL6S9A2FpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaW' +
        'paWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWl' +
        'paWlpaWlpaWlpaWlpaWlpaWlpaWlhbU+ZgAAAAD//+yOtxEAAAMwyOznB8PwyYgJ6CtJv6GwtLS0' +
        'tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0' +
        'tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tMSGB6bX9v6f' +
        '9hYAAAD//9qMlxEAAAMvyGzn/WYYPhkxAX0l6TcUlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaW' +
        'paWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlsbG00AAAA//9SVPgLAAABHUlEQVR42u3QMQEAAAzAsMn' +
        '8mUfB8AmYgL6S9A2FpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaW' +
        'lpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpa' +
        'WlpaWlhbU+ZgAAAAD//+yOtxEAAAMwyOznB8PwyYgJ6CtJv6GwtLS0tLS0tLS0tLS0tLS0tLS0tL' +
        'S0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tL' +
        'S0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0xIYHptf2/p/2FgAAAP//2oyXEQAAAy/IbOf9Zhg+GTE' +
        'BfSXpNxSWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpa' +
        'WlpaWlsbS0NLPAAAA//9SVPgLAAABHUlEQVR42u3QMQEAAAzAsMn8mUfB8AmYgL6S9A2FpaWlpaW' +
        'lpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpa' +
        'WlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlhbU+ZgAAAAD//+yOtx' +
        'EAAAMwyOznB8PwyYgJ6CtJv6GwtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tL' +
        'S0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS5tLm0ubS5tLm0ub' +
        'S5tLm0ubS5tLm0ubS5tLm5tLm0ubS5tLm0ubS5tLm5tLm5uep9+e9f3bYAAAAD//9qMlxEAAAMv' +
        'yGzn/WYYPhkxAX0l6TcUlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaW' +
        'lpaWlpaWlpaWlsbS0NLPAAAA//9bH6ZfBwAAByxJREFUeNrtl81LFEEYxp9pZ9fS/UInDxFyp6D' +
        'oXgRB7RAd/UDoEFEQ9Aeyp87RRYIOQRDfG9I1COpFEBSUIAzW2Z/W8/be991Z26mN7U6s0M6v4GH' +
        'gZ75ndgYGl8MvR1SChFCSfJL8G/gR/iEky0X+T/LpD5fT6dC/7W6aLqf0g+m/6dveY+fJpXWn6Xq' +
        'azqf/m9uH7iWf1i6lf6b63d/f7fN6XvK6x09O65Yur58X0//q37tXn/7tffpX3z9K99O95NP6e0' +
        'v3f3qZ+b1fPvn1uulM+veM09v8V++jNreXfPfMyWldT9PZOf6vG3eWfDrL1NInH++3Y3p/SveI/' +
        'IeQWfPpyVv2fXb53Xv85E1Tf8L5tW+I2K9S6T6/tH0pC8lv2t6fX+7t88mNf/75Yv783iWf1iflf' +
        '6b63d/fYv68XvK6x09On5+X/L+9GdfYfO3vJ/+uV3xPZqbe+/GvV7pvO9v6d9vPrO8Z0//LzK9p' +
        'XWp7n++7mS6ff983nbyz5reX6b/p2+emS+vT2rn09zSfP3E9oX2X7tX7iZOnZ7tM77e609R56l/' +
        'm+8b0fmumL9mN2f/E24m678Yx/Z8Zp3frzXofubTeNp1JfvOfdZ/9u50V9zP/6T/vG8YV7mXW7f' +
        '6YmZ9VbN7P6Tuxm5O9v933E6Puz/8X/G98/x/fWfC/8f2pMvxPfH/+fGfB98bHp8rkCudPhfGdx' +
        'D6O7+P4Pm9P2f9sHff2kf3P1nFvH9l/f12e8T/D26/qBdf3df7tO/9D065pXbLeP6unY9+0K9n3' +
        'mUvdbtf9v5h1b6Oun/W9m0vqF6f8p8n8tG6p0r8f1uW8D3Pr3rP7zEw9XvJp7VK6b/qS98/2Gdf' +
        '6fO/P+vS++uReYlqXpP+U7pndX3dfvYvpxf0lpnVJX+L6z5L6N7mXmNb/s+un9348pX97WffFvb' +
        '6f0ve3+7vXp3Vvl3vO1F7+L/Xf6f/761P/Xz/K+D09mflpXe/V0+/9vVdf5pfP/1/V0vUnM+ve3' +
        'q8PeeR/382+z7+l2f+1q5m99Z/T07X/L59v2t5epn+fmeR8D8un9X7p/+N8Vvt8UmdPpn78v5Hp' +
        'f7Z+Ff8BAAD//wMA/FTo7/gV+1oAAAAASUVORK5CYII=';

      const buffer = Buffer.from(BASE64_PNG, 'base64');
      fs.writeFileSync(png192, buffer);
      fs.writeFileSync(png512, buffer);
      console.log('[Server Bootstrap] Successfully wrote physical files to public disk.');
    }
  } catch (err) {
    console.error('[Server Bootstrap] Regenerating static PNGs failed:', err);
  }
}

// REST Sync Route: GET (Query server master state)
app.get('/api/sync', (req, res) => {
  const currentDB = loadServerDB();
  res.json({
    success: true,
    data: {
      habits: currentDB.habits,
      logs: currentDB.logs,
      isPremium: currentDB.isPremium,
      timestamp: currentDB.timestamp
    }
  });
});

// REST Sync Route: POST (Reconcile state updates from clients)
app.post('/api/sync', (req, res) => {
  try {
    const clientPayload: Partial<ServerSyncPayload> & { clientTime?: number } = req.body || {};
    const serverDB = loadServerDB();

    console.log('[Sync Engine] Processing reconciliation payload from client. Client Time:', clientPayload.clientTime);

    let updated = false;

    // Reconciliation strategy: Match habits by unique IDs & merge arrays
    if (clientPayload.habits && Array.isArray(clientPayload.habits)) {
      const serverHabitsMap = new Map(serverDB.habits.map((h: any) => [h.id, h]));
      
      for (const clientHabit of clientPayload.habits) {
        if (!clientHabit || !clientHabit.id) continue;
        
        const existing = serverHabitsMap.get(clientHabit.id);
        if (!existing) {
          // New habit added client-side
          serverDB.habits.push(clientHabit);
          updated = true;
        } else {
          // Reconcile attributes if newer or changed (order, check details, parameters)
          // For simplicity, client updates overwrite server defaults for simplicity
          const idx = serverDB.habits.findIndex((h: any) => h.id === clientHabit.id);
          if (idx !== -1) {
            serverDB.habits[idx] = { ...serverDB.habits[idx], ...clientHabit };
            updated = true;
          }
        }
      }

      // Safeguard reorders: keep list trimmed to unique elements
      const uniqueKeys = new Set();
      serverDB.habits = serverDB.habits.filter((h) => {
        if (!h || !h.id || uniqueKeys.has(h.id)) return false;
        uniqueKeys.add(h.id);
        return true;
      });
      // Sort habits by order index
      serverDB.habits.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    // Merge logs records
    if (clientPayload.logs && typeof clientPayload.logs === 'object') {
      for (const [key, status] of Object.entries(clientPayload.logs)) {
        if (serverDB.logs[key] !== status) {
          serverDB.logs[key] = status;
          updated = true;
        }
      }
    }

    // Reconcile premium state
    if (clientPayload.isPremium !== undefined && clientPayload.isPremium !== serverDB.isPremium) {
      serverDB.isPremium = clientPayload.isPremium || serverDB.isPremium;
      updated = true;
    }

    if (updated || serverDB.timestamp === 0) {
      serverDB.timestamp = Date.now();
      saveServerDB(serverDB);
      console.log('[Sync Engine] Server records updated & saved to disk. New Timestamp:', serverDB.timestamp);
    } else {
      console.log('[Sync Engine] Payload matched current server records. No changes written.');
    }

    res.json({
      success: true,
      data: {
        habits: serverDB.habits,
        logs: serverDB.logs,
        isPremium: serverDB.isPremium,
        timestamp: serverDB.timestamp
      }
    });

  } catch (err: any) {
    console.error('[Sync Engine] Reconciliation failed:', err);
    res.status(500).json({
      error: true,
      message: err.message || 'Failed to complete bidirectional state synchronization.'
    });
  }
});

// App Entry & Environment Routing Setup
async function startServer() {
  // Ensure physical PWA files exist
  ensurePwaAssets();

  // Vite Integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    // Use vite's connect instance as middleware
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Mossbit Server] Running full-stack offline-ready node server on http://localhost:${PORT}`);
  });
}

startServer();
