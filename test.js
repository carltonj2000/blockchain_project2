const { Blockchain, Block, chainDB } = require("./simpleChain");
const rimraf = require("rimraf"); // utility to remove a non empty directory

(async function() {
  await rimraf(chainDB, e => e && console.error("Failed deleting DB", e));
  chain = new Blockchain();
  chain.getBlockHeight();
  chain.show();
  chain.getBlock(0);
  chain.validateBlock(0);
  chain.validateChain();
  chain.addBlock(new Block("hi"));
  chain.getBlockHeight();
  chain.show();
  chain.getBlock(1);
  chain.validateBlock(1);
  chain.validateChain();
  chain.induceErrorData(1, "bye");
  chain.show();
  chain.validateChain();
})();
