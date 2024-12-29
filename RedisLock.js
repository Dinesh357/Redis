import Redis, { Cluster } from 'ioredis';
import Redlock from "redlock";
const Redis = require('ioredis');

const redisA = new Redis({ host: "" });
const redisB = new Redis({ host: "" });
const client = new Cluster(
  [
    {
      host: "",
      port: 6379,
    },
  ],
);
const sessionLock = new Redlock(
  // You should have one client for each independent redis node
  // or cluster.
  [redisA, redisB],
  {
    // The expected clock drift; for more details see:
    // http://redis.io/topics/distlock
    driftFactor: 0.01, // multiplied by lock ttl to determine drift time
  
    // The max number of times Redlock will attempt to lock a resource
    // before erroring.
    retryCount: 10,
  
    // the time in ms between attempts
    retryDelay: 200, // time in ms
  
    // the max time in ms randomly added to retries
    // to improve performance under high contention
    // see https://www.awsarchitectureblog.com/2015/03/backoff.html
    retryJitter: 200, // time in ms
  
    // The minimum remaining time on a lock before an extension is automatically
    // attempted with the `using` API.
    automaticExtensionThreshold: 500, // time in ms
  }
  );
  module.exports = {
  sessionLock,
  createSession,
  checkIfMaxSession
  };
  
  
  // write a function that access id as sessionId and adds it list of sessions in Redis. The function must also check if the number of sessions reached is 5 then it should remove the old session and add it to the list ensure ll this is locked by session lock
  function createSession(sessionId, userId) {
  const sessionsKey = `usersessions:${userId}`;
  sessionLock.acquire([sessionId], 1000)
    .then(function(lock) {
    return client.llen(sessionsKey)
      .then(function(count) {
      if (count >= 5) {
        return client.rpop(sessionsKey);
      }
      })
      .then(function() {
      return client.lpush(sessionsKey, sessionId);
      })
      .then(function(result) {
      console.log('Session added:', result);
      })
      .finally(function() {
      return lock.release();
      });
    })
    .catch(function(err) {
    console.error('Error adding session:', err);
    });
  }

  // write a function that returns the count of session in Redis and ensure that this is locked by session lock
  function checkIfMaxSession(userId) {
  const sessionsKey = `usersessions:${userId}`;
  sessionLock.acquire([sessionsKey], 1000)
    .then(function(lock) {
    return client.llen(sessionsKey)
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