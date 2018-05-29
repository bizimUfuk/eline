
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
	mottoIPFS.ipfsCAT(node, '/ipfs/QmUbo8jpoymGJMtYRbFNahnXtJguKU18P2k26phHopQsmo/index.html', function (err, extract){
		mottoArea = err ? err : extract;
	});

	app.use(express.static(path.join(__dirname, 'public')))
	  .use(bodyParser.raw({inflate: true, limit: '100kb', type: 'text/html'}))
	  .set('views', path.join(__dirname, 'views'))
	  .set('view engine', 'ejs');

  app.get('/', function (req, res){		//original url: QmdMnYXQ8xH5bxkAN41mR3g9YzB9N1zZhTzGxR1qk9WUyQ
	  let ip = req.connection.remoteAddress;
	  let text = 'INSERT INTO access_logs (ip) VALUES (\'' + ip + '\') ON CONFLICT DO NOTHING RETURNING ip';
	  mottoDB.mottoQry(text, (err, fetch) => {});
	  res.render('pages/index', { mottoArea: mottoArea });
  });

	app.get('/liveline(\/:hash)?(\/:sub)?', function (req, res) {
	  liveline(node, req, res, function (fetch) {
	    res.render('pages/liveline', { user: req.user, mottoArea: mottoArea, alivemottos: fetch.sort(function (a,b) { return b.shill - a.shill; })});
	  });
	});

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

function liveline (nd, request, response, cb){
  var cond = (typeof request.params === 'undefined' || typeof request.params.hash === 'undefined') ? '' : 'WHERE hash = \'' + request.params.hash + '\'';
  var text = 'SELECT * FROM live_hashes() ' + cond;

  mottoDB.mottoQry(text, function (err, fetch) {
    if (err) cb([]);

    var liveHashes = fetch.rows.slice();

    if ((Object.keys(liveHashes).length === 0 && liveHashes.constructor === Array)) response.render('pages/liveline', { alivemottos: (err ? err : []) });

    var mottos = [];		//collection to hold the mottos with extract property
    var counter = 0;

    for (let l = 0; l < liveHashes.length; l++) {
      var lh = liveHashes[l];

      var rt = setTimeout(function (){ return; }, 5000);

      let tempObj = Object.assign({}, lh);

      const mottopath = '/ipfs/' + tempObj.hash + '/index.html';

      mottoIPFS.ipfsCAT(nd, mottopath, (er, extract) => {
        counter++;

        if (er || extract) clearTimeout(rt);
        if (er) return;

        //convert life to remaining minutes
        tempObj.shill = tempObj.shill * 60000 + new Date(tempObj.mtime).getTime();
        /// TODO: Fix this workaround for relative paths in index.html files
        tempObj.extract = u.pathfix (extract, 'src=\'', 'src=\'/ipfs/' + tempObj.hash + '/');
        mottos.push(tempObj);
        return;
      });

      if (counter === liveHashes.length) {
        cb (mottos);
      }
    }
  });
}
