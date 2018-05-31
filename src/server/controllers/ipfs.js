//'use strict';

const target = global.ipfsNode ? ipfsNode : require('../ipfss').initialize((n) => { return n; });

function mottoArea(callback) {
  const targetPeer = {
    peerhash: '/ip4/127.0.0.1/tcp/4001/ipfs/QmU987F9Z9e6eRTc4TEmwcnTqaGHD7gzfDRHX9sY1ySBGN',
    type: 'connect'
  };

  target.swarmPeers(targetPeer, (r) => {
    const mottofield = '/ipfs/QmSo5mU2a4hxkWCZC65GGuuNNn4LemRniH7MMo4Bfh3nf5/index.html';
    target.ipfsCAT(mottofield, (e, f) => {
      callback(e ? e : f);
    });
  });
}

function liveline (request, response, cb){
  var cond = (typeof request.params === 'undefined' || typeof request.params.hash === 'undefined') ? '' : 'WHERE hash = \'' + request.params.hash + '\'';
  var text = 'SELECT * FROM live_hashes() ' + cond;

  knex('hashes').where(
/*
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
  */
}

module.exports = {
  mottoArea: mottoArea,
  liveline: liveline
};
