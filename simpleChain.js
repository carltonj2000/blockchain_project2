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
  constructor() {
    this.inProgress = new Promise((resolve, reject) =>
      (async (resolve, reject) => {
        try {
          this.height = await this.getHeight();
          console.log(this.height);
          if (this.height === 0) {
            console.log("adding");
            await this.addBlock(
              new Block("First block in the chain - Genesis block")
            );
            console.log(
              `Block ${this.lastblock.height} added => ${this.lastblock.body}`
            );
          } else {
            console.log("reading");
            this.lastblock = JSON.parse(await db.get(this.height - 1));
            console.log(
              `Last block ${this.height} seen =>`,
              this.lastblock.body
            );
          }
          resolve();
        } catch (e) {
          console.log("Failed blockchain initialization with", e);
          reject();
        }
      })(resolve, reject)
    );
  }

  // Add new block
  async addBlock(newBlock) {
    try {
      console.log(`Adding (inProgress = ${this.inProgress})`);
      await this.inProgress;
      console.log(`Adding block ${this.height} => ${newBlock.body}`);
      // UTC timestamp
      newBlock.time = new Date()
        .getTime()
        .toString()
        .slice(0, -3);
      // Block height (0 for genesis block. lastbock does not exist yet)
      newBlock.height = this.height;
      // previous block hash
      if (this.height > 0) newBlock.previousBlockHash = this.lastblock.hash;
      // Block hash with SHA256 using newBlock and converting to a string
      newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
      // Adding block object to db
      await db.put(newBlock.height, JSON.stringify(newBlock));
      this.lastblock = newBlock;
      this.height += 1;
      console.log(`Added block ${newBlock.height} => ${newBlock.body}`);
    } catch (e) {
      console.log(`Failed adding block ${this.height} => ${newBlock.body}`);
    }
  }

  getHeight() {
    return new Promise((resolve, reject) => {
      let height = 0;
      db.createReadStream()
        .on("data", data => {
          console.log(data.value);
          height++;
        })
        .on("error", err => {
          console.error("Unable to read data stream!", err);
          reject(err);
        })
        .on("close", () => {
          resolve(height);
        });
    });
  }

  showBc() {
    return new Promise((resolve, reject) => {
      (async (resolve, reject) => {
        console.log("showBc 0 -", this.inProgress);
        try {
          await this.inProgress;
          console.log("showBc 1 -", this.height);
          for (let height = 0; height < this.height; height++) {
            const block = await db.get(height);
            console.log(`Block ${height} => ${block}`);
          }
          resolve();
        } catch (e) {
          console.log("Show blockchain failed!");
          reject();
        }
      })(resolve, reject);
    });
  }

  // Get block height
  getBlockHeight() {
    return this.chain.length - 1;
  }

  // get block
  async getBlock(blockHeight) {
    // Get data from levelDB with key
    try {
      const value = await db.get(blockHeight);
      return JSON.parse(value);
    } catch (err) {
      console.error(`Did not find with block with height ${blockHeight}.`, err);
      return null;
    }
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
