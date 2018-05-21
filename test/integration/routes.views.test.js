process.env.NODE_ENV = 'test';

const chai = require('chai');
const should = chai.should();
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const server = require('../../src/server/app');

describe('routes: views', () => {

  beforeEach((done) => {
    done();
  });

  afterEach((done) => {
    done();
  });

  describe('GET /register', () => {
    it('should render the register view', (done) => {
      chai.request(server)
      .get('/register')
      .end((err, res) => {
        res.redirects.length.should.equal(0);
        res.status.should.equal(200);
        res.type.should.equal('text/html');
        done();
      });
    });
  });

  describe('GET /login', () => {
    it('should render the login view', (done) => {
      chai.request(server)
      .get('/login')
      .end((err, res) => {
        res.redirects.length.should.equal(0);
        res.status.should.equal(200);
        res.type.should.equal('text/html');
        done();
      });
    });
  });

});
