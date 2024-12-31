import promisify from 'util';
import { createSession  } from './RedisLock.js'; 


const userId = 'user123';   
const maxSessions = 5;

function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
async function main() {
    try {

        // Create random sessions
        for (let i = 0; i < maxSessions + 1; i++) {
            const sessionId = `session${Math.floor(Math.random() * 1000)}`;
            const sessionCreated = await createSession(userId, sessionId);
            console.log(`Session ${sessionId} created:`);
            await wait(500);            
           // const isMaxSession = await checkIfMaxSession(userId);
           // console.log(`Is max session reached: ${isMaxSession}`);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
	console.log("exiting");
	process.exit(0)
    }

}

main();
