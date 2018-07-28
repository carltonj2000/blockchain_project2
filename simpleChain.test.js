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

test("delete blockchain", () => {
  // remove any previous presisted blockchains
  rimraf.sync(chainDB, null, e => {
    console.log(e);
    return;
  });
});

test("show/create blockchain", async () => {
  let blockchain = await Blockchain.build();
  blockchain.showBc();
});

test("add one to blockchain", async () => {
  let blockchain = await Blockchain.build();
  console.log(blockchain);
  blockchain.addBlock(new Block("test data carlton"));
});

test("add multiple to blockchain not async", async () => {
  let blockchain = await Blockchain.build();
  for (let i = 0; i < 10; i++) {
    console.log(`call ${i}`);
    await blockchain.addBlock(new Block(`test data ${i}`));
  }
});

test("add multiple to blockchain async", async () => {
  let blockchain = await Blockchain.build();

  async function addBlocks(arr) {
    await arr.reduce(
      (p, e) =>
        p.then(async () => {
          await blockchain.addBlock(new Block(`test data ${e}`));
        }),
      Promise.resolve()
    );
  }
  addBlocks([...Array(10).keys()]);
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
    .filter(line => !line.includes("Found"));
  const arr = noConsole.reduce(
    (r, e) => {
      if (e.includes("]")) return { save: false, result: [...r.result, e] };
      if (e.includes("[")) return { save: true, result: [...r.result, e] };
      if (r.save) return { save: r.save, result: [...r.result, e] };
      return r;
    },
    { save: false, result: [] }
  );
  const r = arr.result;
  const removeLastComma = [
    ...r.slice(0, -2),
    r.slice(-2)[0].replace("},", "}"),
    r.slice(-1)[0]
  ];
  const prePretty = removeLastComma.join("\n");
  const json = JSON.parse(prePretty);
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
    console.log(last);
    next = bc.filter(b => b.previousBlockHash === last.hash);
    if (next.length > 1) console.error("Error. Hash collision at " + last.hash);
    last = next[0];
    blocks++;
  } while (last);
  console.log(`saw ${blocks} blocks`);
});

test("env", () => {
  console.log(process.env.FILE);
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
