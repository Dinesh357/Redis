import Redis, { Cluster } from 'ioredis';
import Redlock from "redlock";

const client = new Cluster(
  [
    {
      host: "x.x.x.x", //Redis cluster dns name
      port: 6379,
    },
  ],
);

// session lock object to lock the session
export const sessionLock = new Redlock(
  // You should have one client for each independent redis node
  // or cluster.
 [client],
  {
    // The expected clock drift; for more details see:
    // http://redis.io/topics/distlock
    driftFactor: 0.01, // multiplied by lock ttl to determine drift time
  
    // The max number of times Redlock will attempt to lock a resource
    // before erroring.
    retryCount: 10,
  
    // the time in ms between attempts
    retryDelay:200, // time in ms
  
    // the max time in ms randomly added to retries
    // to improve performance under high contention
    // see https://www.awsarchitectureblog.com/2015/03/backoff.html
    retryJitter: 200, // time in ms
  
    // The minimum remaining time on a lock before an extension is automatically
    // attempted with the `using` API.
    automaticExtensionThreshold: 500, // time in ms
  }
  );
  

// a function to create a session in Redis and ensure that this is locked by session lock
// this function is gaurded by session lock and hence any other function trying to access the same resource will be blocked
 export async function createSession(userId,sessionId) {
  const sessionsList = `usersessions:${userId}`;
  const lockResource= `lock:${userId}`;

  let lock = await sessionLock.acquire([lockResource],100);
  try{
	let count = await client.llen(sessionsList);
		
      if (count >= 5) {
        await client.rpop(sessionsList);
      }
      else
	{
	  	
        let result = await client.lpush(sessionsList, sessionId);
	console.log('session added ' , result);
		
	count = await client.llen(sessionsList);
	console.log('session length',count);
	}

  }
	
  finally {
	await lock.release();
  }
 }

 sessionLock.on("error", (error) => {
  // Ignore cases where a resource is explicitly marked as locked on a client.
  //if (error instanceof ResourceLockedError) { // To be fixed
   // return;
  //}

  // Log all other errors.
  console.error(error);
});
  
// a function that returns the count of session in Redis and ensure that this is locked by session lock , while retrieving the count
  export function checkIfMaxSession(userId) {
  const sessionsList= `usersessions:${userId}`;
  const lockResource= `lock:${userId}`;
  sessionLock.acquire([lockResource], 100)
    .then(function(lock) {
    return client.llen(sessionsList)
      .then(function(count) {
      console.log('Session count:', count);
      return count >= 5;
      })
      .finally(function() {
      return lock.release();
      });
    })
    .catch(function(err) {
    console.error('Error checking session count:', err);
    });
  }


