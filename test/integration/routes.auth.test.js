process.env.NODE_ENV = 'test';

const chai = require('chai');
const should = chai.should();
const chaiHttp = require('chai-http');

const server = require('../../src/server/app');
const knex = require('../../src/server/db/connection');
const passportStub = require('passport-stub');

chai.use(chaiHttp);
passportStub.install(server);

describe('routes : auth', () => {

  beforeEach(() => {
    return knex.migrate.rollback()
    .then(() => { return knex.migrate.latest(); })
    .then(() => { return knex.seed.run(); });
  });

  afterEach(() => {
    passportStub.logout();
    return knex.migrate.rollback();
  });

  describe('POST /auth/register', () => {
    it('should register a new user (with valid invitation)', (done) => {
      chai.request(server)
      .post('/auth/register')
      .send({
        username: 'validcalled',
        email: 'validcalled@validcalled.com',
        password: 'validcalled',
        referrer: 'validcaller',
        invicode: 'validcode'
      })
      .end((err, res) => {
        should.not.exist(err);
        res.redirects.length.should.eql(1);
        res.status.should.eql(200);
        res.type.should.equal('text/html');
        done();
      });
    });

    it('should not register expired invitation', (done) => {
      chai.request(server)
      .post('/auth/register')
      .send({
        username: 'expiredinvitation',
        email: 'expiredinvitation@expiredinvitation.com',
        password: 'expiredinvitation',
        referrer: 'expiredinvitation',
        invicode: 'expiredinvitation'
      })
      .end((err, res) => {
        should.not.exist(err);
        res.redirects.length.should.eql(1);
        res.status.should.eql(200);
        res.type.should.equal('text/html');
        done();
      });
    });

    it('should not register an existing username', (done) => {
      chai.request(server)
      .post('/auth/register')
      .send({
        username: 'fkm',
        email: 'fkm0@fkm.com',
        password: 'fkm',
        referrer: 'jen',
        invicode: 'ABCD'
      })
      .end((err, res) => {
        should.not.exist(err);
        res.redirects.length.should.eql(1);
        res.status.should.eql(200);
        res.type.should.equal('text/html');
        done();
      });
    });
  });

  describe('POST /auth/login', () => {
    it('should login a user', (done) => {
      chai.request(server)
      .post('/auth/login')
      .send({
        username: 'jeremy',
        password: 'johnson123'
      })
      .end((err, res) => {
        should.not.exist(err);
        res.redirects.length.should.eql(1);
        res.status.should.eql(200);
        res.type.should.eql('text/html');
        done();
      });
    });

    it('should not login an unregistered user', (done) => {
      chai.request(server)
      .post('/auth/login')
      .send({
        username: 'micooo',
        password: 'johann'
      })
      .end((err, res) => {
        should.not.exist(err);
        res.redirects.length.should.eql(1);
        res.type.should.eql('text/html');
        done();
      });
    });
  });

  describe('GET /auth/logout', () => {
    it('should logout a user', (done) => {
      passportStub.login({
        username: 'jeremy',
        password: 'johnson123'
      });
      chai.request(server)
      .get('/auth/logout')
      .end((err, res) => {
        should.not.exist(err);
        res.redirects.length.should.eql(1);
        res.status.should.eql(200);
        res.type.should.eql('text/html');
        done();
      });
    });
    it('should throw an error if a user is not logged in', (done) => {
      chai.request(server)
      .get('/auth/logout')
      .end((err, res) => {
        should.exist(err);
        res.redirects.length.should.eql(0);
        res.status.should.eql(401);
        res.type.should.eql('application/json');
        res.body.status.should.eql('Please log in');
        done();
      });
    });
  });

  describe('GET /user', () => {
    it('should return a success', (done) => {
      passportStub.login({
        username: 'jeremy',
        password: 'johnson123'
      });
      chai.request(server)
      .get('/user')
      .end((err, res) => {
        should.not.exist(err);
        res.redirects.length.should.eql(0);
        res.status.should.eql(200);
        res.type.should.eql('application/json');
        res.body.status.should.eql('success');
        done();
      });
    });
    it('should throw an error if a user is not logged in', (done) => {
      chai.request(server)
      .get('/user')
      .end((err, res) => {
        should.exist(err);
        res.redirects.length.should.eql(0);
        res.status.should.eql(401);
        res.type.should.eql('application/json');
        res.body.status.should.eql('Please log in');
        done();
      });
    });
  });

  describe('GET /admin', () => {
    it('should return a success', (done) => {
      passportStub.login({
        username: 'ufuk',
        password: 'ufuk'
      });
      chai.request(server)
      .get('/admin')
      .end((err, res) => {
        should.not.exist(err);
        res.redirects.length.should.eql(0);
        res.status.should.eql(200);
        res.type.should.eql('application/json');
        res.body.status.should.eql('success');
        done();
      });
    });
    it('should throw an error if a user is not logged in', (done) => {
      chai.request(server)
      .get('/admin')
      .end((err, res) => {
        should.exist(err);
        res.redirects.length.should.eql(0);
        res.status.should.eql(401);
        res.type.should.eql('application/json');
        res.body.status.should.eql('Please log in');
        done();
      });
    });
    it('should throw an error if a user is not an admin', (done) => {
      passportStub.login({
        username: 'fkm',
        password: 'fkm'
      });
      chai.request(server)
      .get('/admin')
      .end((err, res) => {
        should.exist(err);
        res.redirects.length.should.eql(0);
        res.status.should.eql(401);
        res.type.should.eql('application/json');
        res.body.status.should.eql('You are not authorized');
        done();
      });
    });
  });

});
