
var u = require('./src/mottoUtils');

var mottoDB = require('./src/mottoDB');
var mottoIPFS = require('./src/mottoIPFS');

const express = require('express');
var bodyParser = require('body-parser');

const path = require('path');
const PORT = process.env.PORT || 5000;

var app = express();
var hash = '';
var node;
var mottoArea;

mottoIPFS.spawnNode(path.join(__dirname, 'mottoRepo'), (api) => {
  //initialize node
	node = api;

  app.post('/vote', function (req, res){
      mottoDB.mottoVote(req, (fetch) => res.send(fetch));
  });

  app.get('/db/(:hash)?', function (req, res){
	  const cond = typeof req.params.hash === 'undefined' ? '' : 'WHERE hash=\'' + req.params.hash + '\'';
	  var text = 'SELECT * FROM hashes ' + cond + ' ORDER BY did';
	  if (req.params.hash === 'live_hashes') text = 'SELECT * FROM live_hashes()';
	  mottoDB.mottoQry(text, (err, fetch) => res.render('pages/db', {title: 'Database Results', results: err ? err : fetch.rows}));
	});

  app.get('/ipfs.ls/(:path(Qm*)(/:sub)?)?', function (req, res){
	  let pat  = req.params.sub  === undefined ? req.params.path : req.params.path + '/' + req.params.sub;
	  mottoIPFS.ipfsLS(node, pat, function (err, list){
		  let rendering = '';
		  list.forEach((lnk) => {
		    rendering += '<br> >>>type: ' + lnk.type + ' hash: ' + lnk.hash + ' size: ' + lnk.size + ' name: ' + lnk.name + '\n';
		  });
		  res.send('OK\n' + rendering);
	  });
	});

  app.get('/ipfs/:hash\/?(\/:sub)?', function (req, res){
	  let hash = req.params.hash;
	  let sub = typeof req.params.sub !== 'undefined' ? req.params.sub : '';
	  let path = '/ipfs/' + hash + '/' + sub;
	  mottoIPFS.ipfsCAT(node, path, function (err, extract) {
		    res.end(extract);
	  });
	});

  app.put('/ipfs(/:hash)?((/)?:filename)?', function (req, res){
		  mottoIPFS.ipfsPUT(node, req.params.hash, {filename: req.params.filename, filebuffer: req.body}, function (error, response){
			  if (error) res.status(500).send('Failed to put IPFS hash');
			  u.logdebug('response from ipfsPUT for %s: %o',  req.params.hash, response);
			  res.setHeader('Ipfs-Hash', response);
			  res.send('ipfsPUT:OK');
		  });
	  });

  app.get('/ipfsDB/', function (req, res) {
		  let record = req.headers.wrapper;
		  let qry = 'INSERT INTO hashes (hash) VALUES (\'' + record + '\') ON CONFLICT DO NOTHING RETURNING hash';
		  mottoDB.mottoQry(qry, (err, dBres) => {
			  u.logdebug('Successfully inserted %s into hashes db', record, dBres && dBres.rowCount);
			  res.write('inserted', dBres & dBres.rowCount);
			  res.send();
		  });
	  });

  app.get('/swarm/:type(peers|connect|bootstrap)(\/)?(:peerhash(*))?', function (request, response) {
  		mottoIPFS.swarmPeers(node, request.params, function (pl) {
  		    response.render('pages/db', { results: pl, title: 'Peer List' });
  		  });
  	});

  app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
});
