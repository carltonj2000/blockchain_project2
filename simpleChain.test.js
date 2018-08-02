const { Blockchain, Block, chainDB } = require("./simpleChain");
const rimraf = require("rimraf"); // utility to remove a non empty directory

test("new blockchain", async done => {
  // remove any previous presisted blockchains
  await rimraf(chainDB, e => e && console.log("Failed deleting DB.", e));
  let blockchain = new Blockchain();
  blockchain.finishActions().then(() => done());
});

test("show blockchain", done => {
  let blockchain = new Blockchain();
  blockchain.showBc();
  blockchain.finishActions().then(() => done());
});

test("add one to blockchain", done => {
  let blockchain = new Blockchain();
  blockchain.addBlock(new Block("test data carlton"));
  //blockchain.showBc();
  blockchain.finishActions().then(() => done());
});

test("add multiple to blockchain", done => {
  let blockchain = new Blockchain();
  for (let i = 0; i < 10; i++) {
    blockchain.addBlock(new Block(`test data ${i}`));
  }
  blockchain.finishActions().then(() => done());
});

test("validate blockchain", done => {
  let blockchain = new Blockchain();
  blockchain.validateChain();
  blockchain.finishActions().then(() => done());
});

test("induce errors in blockchain", done => {
  let blockchain = new Blockchain();
  let inducedErrorBlocks = [2, 4, 7];
  for (var i = 0; i < inducedErrorBlocks.length; i++) {
    blockchain.induceErrorData(
      inducedErrorBlocks[i],
      `induced chain error ${i}`
    );
  }
  blockchain.finishActions().then(() => done());
});

test("full test", async done => {
  // remove any previous presisted blockchains
  await rimraf(chainDB, e => e && console.log("Failed deleting DB.", e));
  let blockchain = new Blockchain();

  for (var i = 0; i <= 10; i++) {
    blockchain.addBlock(new Block("test data " + i));
  }

  blockchain.validateChain();

  let inducedErrorBlocks = [2, 4, 7];
  for (var i = 0; i < inducedErrorBlocks.length; i++) {
    blockchain.induceErrorData(
      inducedErrorBlocks[i],
      `induced chain error ${i}`
    );
  }

  blockchain.validateChain();
  blockchain.finishActions().then(() => done());
});
