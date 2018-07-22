const { Blockchain, Block, chainDB } = require("./simpleChain");
// utility used to remove the blockchain storage directory
const rimraf = require("rimraf");

test.skip("generate block chain", () => {
  // remove any previous presisted blockchains
  rimraf.sync(chainDB, e => {
    console.log(e);
    return;
  });

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

test.skip("delete blockchain", () => {
  // remove any previous presisted blockchains
  rimraf.sync(chainDB, null, e => {
    console.log(e);
    return;
  });
});

test.skip("show/create blockchain", () => {
  let blockchain = Blockchain.build();
});

test.skip("add one to blockchain", async () => {
  let blockchain = await Blockchain.build();
  console.log(blockchain);
  blockchain.addBlock(new Block("test data carlton"));
});

test.skip("add multiple to blockchain", async () => {
  let blockchain = await Blockchain.build();

  async function addBlocks(arr) {
    await arr.reduce(
      (p, e) =>
        p.then(async () => {
          await blockchain.addBlock(new Block("test data " + 1));
        }),
      Promise.resolve()
    );
  }
  addBlocks([...Array(10).keys()]);
});

test("scratchpad1", done => {
  function sleep(ms) {
    return new Promise((resolve, reject) => {
      setTimeout(() => resolve(ms), ms);
    });
  }

  (async () => {
    console.log("before", new Date());
    const ms = await sleep(1000);
    console.log("ms=", ms, "after", new Date());
    done();
  })();
});

test("scratchpad2", done => {
  async function fizz(arr) {
    await arr.reduce(
      (p, e, i) =>
        p.then(async () => {
          await foo(e);
        }),
      Promise.resolve()
    );
    console.log("done");
    done();
  }
  function foo(x) {
    // some awaitable func
    return new Promise(r =>
      window.setTimeout(() => r(console.log("foo", x)), 500)
    );
  }
  fizz([1, 2, 3]); // invoke
});
