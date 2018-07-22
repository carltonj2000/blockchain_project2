"use strict";
/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/

const level = require("level");
const chainDB = "./blockchain";
const db = level(chainDB);

/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require("crypto-js/sha256");

/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block {
  constructor(data) {
    (this.hash = ""),
      (this.height = 0),
      (this.body = data),
      (this.time = 0),
      (this.previousBlockHash = "");
  }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain {
  constructor(lastbock) {
    if (typeof lastbock === "undefined") {
      throw new Error("Cannot be called directly. Use the build method.");
    }
    this.lastbock = lastbock;
  }

  static async build() {
    let height = await Blockchain.readBc();
    if (!height)
      await Blockchain.addBlock(
        new Block("First block in the chain - Genesis block")
      );
    return new Blockchain(Blockchain.lastbock);
  }

  static readBc() {
    return new Promise((resolve, reject) => {
      let height = 0;
      db.createReadStream()
        .on("data", data => {
          Blockchain.lastblock = JSON.parse(data.value);
          console.log(`Processing block ${height}`, Blockchain.lastblock);
          height++;
        })
        .on("error", err => {
          console.log("Unable to read data stream!", err);
          reject(err);
        })
        .on("close", () => {
          console.log(`Found ${height} Block(s)`);
          resolve(height);
        });
    });
  }

  // Add new block
  addBlock(newBlock) {
    Blockchain.addBlockS(newBlock);
  }
  static async addBlockS(newBlock) {
    // UTC timestamp
    newBlock.time = new Date()
      .getTime()
      .toString()
      .slice(0, -3);
    // Block height (0 for genesis block. lastbock does not exist yet)
    const height = Blockchain.lastblock ? Blockchain.lastblock.height + 1 : 0;
    newBlock.height = height;
    console.log(`Adding Block ${height}`);
    // previous block hash
    if (height > 0) newBlock.previousBlockHash = Blockchain.lastblock.hash;
    // Block hash with SHA256 using newBlock and converting to a string
    newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
    // Adding block object to db
    await db.put(height, JSON.stringify(newBlock), function(err) {
      if (err) return console.log("Block " + key + " submission failed", err);
    });
    Blockchain.lastblock = newBlock;
    console.log(`Added Block ${height}`);
  }

  // Get block height
  getBlockHeight() {
    return this.chain.length - 1;
  }

  // get block
  getBlock(blockHeight) {
    // return object as a single string
    return JSON.parse(JSON.stringify(this.chain[blockHeight]));
  }

  // validate block
  validateBlock(block) {
    // get block hash
    let blockHash = block.hash;
    // remove block hash to test block integrity
    block.hash = "";
    // generate block hash
    let validBlockHash = SHA256(JSON.stringify(block)).toString();
    // Compare
    if (blockHash === validBlockHash) {
      return true;
    } else {
      console.log(
        "Block #" +
          blockHeight +
          " invalid hash:\n" +
          blockHash +
          "<>" +
          validBlockHash
      );
      return false;
    }
  }

  // Validate blockchain
  validateChain() {
    const self = this;
    let errorLog = [];
    let height = 0;
    let previousHash = "";
    db.createReadStream()
      .on("data", function(data) {
        height++;
        const block = JSON.parse(data.value);
        if (!self.validateBlock(block)) errorLog.push(height);
        if (block.hash !== previousHash) {
          errorLog.push(height);
        }
        previousHash = block.hash;
      })
      .on("error", function(err) {
        return console.log("Unable to read data stream!", err);
      })
      .on("close", function() {
        console.log(`Verified ${height} Block(s)`);

        if (errorLog.length > 0) {
          console.log("Block errors = " + errorLog.length);
          console.log("Blocks: " + errorLog);
        } else {
          console.log("No errors detected");
        }
      });
  }
}

Blockchain.lastbock = null;

module.exports = {
  Block,
  Blockchain,
  chainDB
};
