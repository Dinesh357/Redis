const Redis = require('ioredis');
const { promisify } = require('util');
const { createSession, checkIfMaxSession } = require('./RedisLock'); // Updated to RedisLock.js

const client = new Redis.Cluster(
    [
      {
        host: "",
        port: 6379,
      },
    ],
  );
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);

const userId = 'user123';   
const maxSessions = 5;

async function main() {
    try {
        // Create user
        await setAsync(userId, JSON.stringify({ id: userId, sessions: [] }));
        console.log(`User ${userId} created`);

        // Create random sessions
        for (let i = 0; i < maxSessions + 1; i++) {
            const sessionId = `session${Math.floor(Math.random() * 1000)}`;
            const sessionCreated = await createSession(userId, sessionId);
            console.log(`Session ${sessionId} created: ${sessionCreated}`);
            
            const isMaxSession = await checkIfMaxSession(userId, maxSessions);
            console.log(`Is max session reached: ${isMaxSession}`);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        client.quit();
    }
}

main();