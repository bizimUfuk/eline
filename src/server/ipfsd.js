 // 'use strict';
(function() {

  const path = require('path');

  const repository = path.join(__dirname, 'mottoRepo');
  var u = require('../mottoUtils');

  const IPFSFactory = require('ipfsd-ctl');
  const f = IPFSFactory.create({ type: 'proc', exec: require('ipfs')});

  const startDaemon = (ipfsd, cb) => {
	  ipfsd.start ((err, api) => {
		  if (err) { throw err; }
		  if (ipfsd.started) { cb (api); }
	  });
  };

  function spawnNode (cb) {
	  f.spawn ({ disposable: false, repoPath: repository }, (err, ipfsd) => {
		  if (err) { throw err; }

		  if (ipfsd.initialized) {
			  u.logdebug ('ipfsd: already initialized. starting ipfsd>');
			  startDaemon (ipfsd, (node) => cb (node));
		  } else {
			  u.logdebug ('ipfsd: not initialized. initializing>');
			  ipfsd.init ((err) => {
				  if (err) { throw err; }
				  u.logdebug ('ipfsd: initialized now. starting ipfsd>');
				  startDaemon (ipfsd, (node) => cb (node));
			  });
		  }
	  });
  }

  function ipfsLS(dag, goback){
	  this.ls(dag, (err, subItem) => {
		  goback(err, subItem);
	  });
  }

  function ipfsCAT(path, goback){
    var target = this;
	  var pieces = path.split('/');
	  var ipfspiece = pieces.indexOf('ipfs');

	  if (u.isValidHash (pieces[ipfspiece + 1]) === false) goback('Err: Not valid hash', null);

	  target.ipfsLS(path, (err, subItem)=> {

		  if (err || subItem === null) goback('ipfsLS error in ipfsCAT. path: ' + path.toString(), null);

		  if (subItem && subItem.length > 0) {
			  u.logdebug('Path- %s is a directory dag. Rolling out %d links!', path, subItem.length);
			  let specFileIndex = -1;
			  subItem.forEach ((itm, ind) => { if (u.isSpecFile(itm.name)) specFileIndex = ind; });

			  if (specFileIndex >= 0){
				  if (path.slice(-1) !== '/') path = path + '/';
				  target.ipfsCAT (path + subItem[specFileIndex].name, (err, res) => goback(err, res));

			  } else {
			    ///no html file inside
				  let itemlist = '<html><body><ul>';
				  subItem.forEach((it)=> itemlist += '<li><a href=\'' + path + it.name + '\'>' + it.name + '</a></li>\n');
				  itemlist += '</ul></body></html>';
				  goback(null, itemlist);
			  }
		  } else if (subItem && subItem.length === 0){
			  u.logdebug('Catching file type dag > %s', path);
			  target.files.cat(path, (err, res) =>{
				  u.logdebug('\t %s cat result: ', path, err ? 'Fail!' : 'Success');
				  goback(null, res);
			  });
		  } else {
			  console.log('subItem not null but > : ', subItem);
			  goback('Err -> subItem.type: ' + typeof subItem + '.', null);
		  }
	  });
  }

  function ipfsPUT(nd, prevDir, data, goback){
    /// aData: temporary collection to push the content of the prevDir
	  var aData = [];
	  /// new data do add into prevDir
    var newData = {content: data.filebuffer, path: './' + data.filename };

	  ipfsLS(nd, prevDir, (err, pfiles)=>{
      /// check whether the prevDir is a Directory (wrapper hash) or something else (empty dir, any hash)
		  if (err) throw err;

      /// prevDir has pfiles inside
		  if (pfiles.length !== 0) {

			  pfiles.forEach((pfile) => {
				  nd.files.cat(pfile.hash, (err, res) => {

					  if (err) throw err;

					  aData.push({content: res, path: './' + pfile.name});

					  if (aData.length === pfiles.length) {

						  aData.push(newData);

						  nd.files.add(aData, [{ wrapWithDirectory: true, recursive: true }], function (err, addedfiles) {
							  if (err) goback('Error in ipfsPUT. pfiles.length !==0 >> ' + err, null);
							  u.logdebug('FilesAdded into prev Dir DAG: ', addedfiles);
							  let returnhash = addedfiles[addedfiles.findIndex(u.isWrapper)].hash;
							  if (!u.isValidHash(returnhash)) {
								  u.logdebug('Err: returnhash-%s is not a valid hash', returnhash.toString());
								  goback('Err: returnhash is not a valid hash!', null);
							  } else {
								  goback(null, returnhash);
							  }
						  });
					  }
				  });///nd.files.cat closure
			  });
		  } else if (JSON.stringify(pfiles) === '[]'){
		    ///prevDir is either emptyDir, or some other thing to ignore

			  nd.files.add([newData], [{wrapWithDirectory: true, recursive: true}],(err, addedfiles)=>{
				  if (err) goback('Error in ipfsPUT. pfiles === [] >>', null);

				  u.logdebug('FilesAdded into a new Dir DAG: ', addedfiles);
				  let returnhash = addedfiles[addedfiles.findIndex(u.isWrapper)].hash;
				  if (!u.isValidHash(returnhash)){
					  u.logdebug('Err: returnhash-%s is not a valid hash', returnhash.toString());
					  goback('Err: returnhash is not a valid hash!', null);
				  } else {
					  goback(null, returnhash);
				  }
			  });
		  } else {
			  u.logdebug('ipfsPUT: pfiles not null, neither has length property! Check whats wrong. \n\t pfiles: %O \n\t err: %O', pfiles, err);
			  goback('ipfsLS error. prevDir: ' + prevDir.toString(), null);
		  }
	  });
  }
  ///SWARM FUNCTIONS
  function swarmPeers(phash, cb){

    var target = this;

	  var peerList = [];
	  var type = phash.type;
	  var peerhash = phash.peerhash;

	  switch (type){
		  case 'bootstrap':
			  u.readfromtxtfile ('./utils/bootstrapnodes.txt', (lst) => {
				  lst.forEach ((peer) => {
					  if (peer && (peer !== '--end--')) target.swarm.connect (peer, (err) => {
						  u.logdebug(err ? err : 'Connected to: ' + peer.toString());
					  });
				  });
				  cb(true);
			  });
			  break;
		  case 'connect':
			  if (peerhash !== 'undefined'){
				  target.swarm.connect(peerhash, (err)=>{
					  u.logdebug(err ? 'Couldnt connect to: ' : 'Connected to: ', phash.peerhash);
					  cb(err ? 'error' : true);
				  });
			  }
			  break;

		  case 'peers':
			  target.swarm.peers (function (err, peerInfos) {
				  peerInfos.forEach (function (p) {
					  peerList.push (p.peer.id._idB58String);
					  if (peerInfos.length === peerList.length) {
						  var ret = peerList.reduce (function (acc, cur, ind) {
							  var temp = {};
							  temp.hash = cur;
							  acc.push (temp);
							  return acc;
						  }, []);
						  cb (ret);
					  }
				  });
			  });
			  break;
	  }
  }

  function startIPFS() {
    return new Promise((resolve, reject) => {
          spawnNode((node) => {
            if (node.state._state !== 'running') return reject('failure');
              node.ipfsLS = ipfsLS;
              node.ipfsCAT = ipfsCAT;
              node.ipfsPUT = ipfsPUT;
              node.swarmPeers = swarmPeers;
              resolve(node);
          });
    });
  }

  const ipfsStatus = global.ipfsNode && ipfsNode.state._state;

  module.exports = {
        startIPFS: startIPFS
  };
}());
