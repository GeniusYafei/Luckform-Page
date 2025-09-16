import request from 'supertest';
import server from '../src/server';
import { reset } from '../src/service';
const IMAGE2 = "data:image/png;base64,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";
const IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';

const INVALID_TOKEN = 'Cactusbot';

const USER1 = {
  name: 'Betty',
  email: 'betty@email.com',
  password: 'cardigan',
  image: IMAGE,
};

const USER2 = {
  name: 'Augustine',
  email: 'augustine@email.com',
  password: 'august',
  image: IMAGE,
};

const USER3 = {
  name: 'James',
  email: 'james@email.com',
  password: 'betty',
};

const USER4 = {
  name: 'a',
  email: 'a@a.com',
  password: 'a',
};

const USER5 = {
  name: 'b',
  email: 'b@b.com',
  password: 'b',
};

const USER6 = {
  name: 'c',
  email: 'c@c.com',
  password: 'c',
};
const JOB1 = {
  title: 'Hello Kitty Director',
  image: IMAGE2,
  start: '2011-10-05T14:48:00.000Z',
  description: 'Dedicated technical wizard with a passion and interest in human relationships',
};

const Google = {
  title: 'Job 1',
  image: IMAGE2,
  start: '2023-03-27T15:30:47.201Z',
  description: 'First job',
};

const Facebook = {
  title: 'Job 2',
  image: IMAGE2,
  start: '2023-03-27T16:30:47.201Z',
  description: 'Second job',
};

const Amazon = {
  title: 'Job 3',
  image: IMAGE2,
  start: '2023-03-27T15:30:47.201Z',
  description: 'Third job',
};

const Atlassian = {
  title: 'Job 4',
  image: IMAGE2,
  start: '2023-03-27T16:30:47.201Z',
  description: 'Fourth job',
};

const Canva = {
  title: 'Job 5',
  image: IMAGE2,
  start: '2023-03-27T17:30:47.201Z',
  description: 'Fifth job',
};

const Pearler = {
  title: 'Job 6',
  image: IMAGE2,
  start: '2023-03-27T18:30:47.201Z',
  description: 'Sixth job',
};

const jobs = [Google, Facebook, Amazon, Atlassian, Canva, Pearler]


const postTry = async (path, status, payload, token) => sendTry('post', path, status, payload, token);
const getTry = async (path, status, payload, token) => sendTry('get', path, status, payload, token);
const deleteTry = async (path, status, payload, token) => sendTry('delete', path, status, payload, token);
const putTry = async (path, status, payload, token) => sendTry('put', path, status, payload, token);

const sendTry = async (typeFn, path, status = 200, payload = {}, token = null) => {
  let req = request(server);
  if (typeFn === 'post') {
    req = req.post(path);
  } else if (typeFn === 'get') {
    req = req.get(path);
  } else if (typeFn === 'delete') {
    req = req.delete(path);
  } else if (typeFn === 'put') {
    req = req.put(path);
  }
  if (token !== null) {
    req = req.set('Authorization', `Bearer ${token}`);
  }
  const response = await req.send(payload);
  if (response.statusCode !== status) {
    console.log(response.body);
  }
  expect(response.statusCode).toBe(status);
  return response.body;
};

const validToken = async (user) => {
  const { token } = await postTry('/auth/login', 200, {
    email: user.email,
    password: user.password,
  });
  return token;
}

const publicChannelId = async () => {
  const { channels } = await getTry('/channel', 200, {}, await validToken(USER1));
  return channels[0].private ? channels[1].id : channels[0].id;
};

const privateChannelId = async () => {
  const { channels } = await getTry('/channel', 200, {}, await validToken(USER1));
  return channels[0].private ? channels[0].id : channels[1].id;
};

const getUserId = async (user) => {
  const { users, } = await getTry('/user', 200, {}, await validToken(USER1));
  return users.find(u => u.email === user.email).id;
}

describe('Resetting database', () => {

  beforeEach(async () => {
    reset();    
  });

  beforeAll(() => {
    server.close();
  });

  describe('Resetting database', () => {
    it('Resetting database', async () => {
      const globals = {};

      globals.ret1 = await postTry('/auth/register', 200, {
        email: USER1.email,
        password: USER1.password,
        name: USER1.name,
      });

      globals.ret2 = await postTry('/auth/register', 200, {
        email: USER2.email,
        password: USER2.password,
        name: USER2.name,
      });

      globals.ret3 = await postTry('/auth/register', 200, {
        email: USER3.email,
        password: USER3.password,
        name: USER3.name,
      });

      globals.ret4 = await postTry('/auth/register', 200, {
        email: USER4.email,
        password: USER4.password,
        name: USER4.name,
      });

      globals.ret5 = await postTry('/auth/register', 200, {
        email: USER5.email,
        password: USER5.password,
        name: USER5.name,
      });

      globals.ret6 = await postTry('/auth/register', 200, {
        email: USER6.email,
        password: USER6.password,
        name: USER6.name,
      });

      await putTry(`/user/watch`, 200, { id: globals.ret2.userId, turnon: true }, await globals.ret1.token);
      await putTry(`/user/watch`, 200, { id: globals.ret3.userId, turnon: true }, await globals.ret1.token);
      await putTry(`/user/watch`, 200, { id: globals.ret3.userId, turnon: true }, await globals.ret2.token);
      // Have user C watch user B
      await putTry(`/user/watch`, 200, { id: globals.ret5.userId, turnon: true }, await globals.ret6.token);

      const { id1 } = await postTry(`/job`, 200, JOB1, await globals.ret1.token);
      // Create 6 jobs with user B
      const jobIds = [];
      for (let job of jobs) {
        const { id } = await postTry(`/job`, 200, job, await globals.ret5.token);
        jobIds.push(id);
      }
      // User C will like every post and post a comment
      for (let jobId of jobIds) {
        await putTry(`/job/like`, 200, { id: jobId, turnon: true }, await globals.ret6.token);
        await postTry(`/job/comment`, 200, { id: jobId, comment: "Hello world" }, await globals.ret6.token);
      }
    });

  });

});
