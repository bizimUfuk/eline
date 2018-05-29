
function mottoArea(callback) {
  ipfsNode = global.ipfsNode || require('../ipfsd').initialize((node) => { global.ipfsNode = node; });
  ipfsNode.swarmPeers({peerhash: '/ip4/127.0.0.1/tcp/4001/ipfs/QmU987F9Z9e6eRTc4TEmwcnTqaGHD7gzfDRHX9sY1ySBGN', type: 'connect'}, (r) => {
    if (r) {
      ipfsNode.ipfsCAT('/ipfs/QmUbo8jpoymGJMtYRbFNahnXtJguKU18P2k26phHopQsmo/index.html', (e, f) => {
        callback(e ? e : f);
      });
    }
  });
}

module.exports = {
  mottoArea
};
