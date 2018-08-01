const { Blockchain, Block, chainDB } = require("./simpleChain");
const rimraf = require("rimraf"); // utility to remove a non empty directory

test("new blockchain", done => {
  // remove any previous presisted blockchains
  rimraf(chainDB, e => {
    if (e) return console.log(e);
    let blockchain = new Blockchain();
    blockchain.finishActions().then(() => done());
  });
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

const fs = require("fs");
const getJson = () => {
  const file = process.env.FILE;
  if (!file) return console.error('run via => FILE=fn.txt jest -t "process"');
  if (!fs.existsSync(file)) return console.error("Error! Could not find", file);
  const contents = fs.readFileSync(file).toString();
  const noConsole = contents
    .split("\n")
    .filter(line => !line.includes("console"))
    .filter(line => line)
    .join(",\n");
  const wrapper = `{ "result" : [ ${noConsole} ]}`;
  const json = JSON.parse(wrapper);
  const pretty = JSON.stringify(json, null, 2);
  console.log(pretty);
  return json.result;
};

test("process", () => {
  const bc = getJson();
  const genisis = bc.filter(b => b.previousBlockHash === "");
  if (!genisis) return console.log("genisis not found");
  let last = genisis[0];
  let next;
  let blocks = 0;
  do {
    next = bc.filter(b => b.previousBlockHash === last.hash);
    if (next.length > 1) console.error("Error. Hash collision at " + last.hash);
    last = next[0];
    blocks++;
  } while (last);
  console.log(`saw ${blocks} blocks`);
});

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

test("scratchpad3", async done => {
  console.log("scratchpad3");
  const getNumberP = () =>
    new Promise(resolve => setTimeout(() => resolve(1), 1000));
  /* this works - uncomment to see it in action
  getNumberP().then(n => {
    console.log(n);
    done();
  });
  */
  const getNumber = async () => await getNumberP();
  const number = getNumber();
  console.log(await number);
  console.log(await number);
  done();
});

test("scratchpad4", done => {
  const log = msg => console.log(msg);
  log("hi");
  console.log("scratchpad4");
  let inProgress = Promise.resolve();
  inProgress = inProgress.then(
    _ => new Promise(resolve => setTimeout(() => log("one") || resolve(), 200))
  );
  inProgress = inProgress.then(
    _ => new Promise(resolve => setTimeout(() => log("two") || resolve(), 200))
  );
  inProgress = inProgress.then(
    _ =>
      new Promise(resolve => setTimeout(() => log("three") || resolve(), 200))
  );
  inProgress.then(() => done());
});
