const { Blockchain, Block } = require("./simpleChain");

test("generate block chain", () => {
  let blockchain = new Blockchain();

  expect(blockchain).not.toBe(null);

  for (var i = 0; i <= 10; i++) {
    blockchain.addBlock(new Block("test data " + i));
  }

  blockchain.validateChain();

  let inducedErrorBlocks = [2, 4, 7];
  for (var i = 0; i < inducedErrorBlocks.length; i++) {
    blockchain.chain[inducedErrorBlocks[i]].data = "induced chain error";
  }

  blockchain.validateChain();
});
