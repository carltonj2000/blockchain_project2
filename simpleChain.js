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
    this.inProgress = Promise.resolve();
    this.inProgress = this.inProgress.then(() => this.getHeight());
    this.inProgress = this.inProgress.then(() => {
      console.log("height =", this.height);
      if (this.height === 0)
        this.addBlock(new Block("First block in the chain - Genesis block"));
      else Promise.resolve();
    });
    this.inProgress = this.inProgress.then(
      () =>
        new Promise((resolve, reject) => {
          const height = this.height - 1;
          this.getBlock(height)
            .then(block => {
              this.previousHash = block.hash;
              resolve();
            })
            .catch(e => {
              console.log("Failed getting block = ${height}.", e);
              reject(e);
            });
        })
    );
  }

  cleanUp() {
    return this.inProgress;
  }
  // Add new block
  addBlock(newBlock) {
    const nextAction = new Promise((resolve, reject) => {
      // UTC timestamp
      newBlock.time = new Date()
        .getTime()
        .toString()
        .slice(0, -3);
      // Block height
      newBlock.height = this.height;
      // previous block hash
      if (this.height > 0) newBlock.previousBlockHash = this.previousHash;
      // Block hash with SHA256 using newBlock and converting to a string
      newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
      // Adding block object to db
      db.put(newBlock.height, JSON.stringify(newBlock), err => {
        if (err) {
          console.log(
            `Failed adding block ${newBlock.height} => ${newBlock.body}.`,
            err
          );
          return reject(err);
        }
        this.previousHash = newBlock.hash;
        this.height += 1;
        console.log(`Added block ${newBlock.height} => ${newBlock.body}`);
        return resolve();
      });
    });
    this.inProgress = this.inProgress.then(_ => nextAction);
    return this.inProgress;
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
          this.height = height;
          resolve();
        });
    });
  }

  showBc() {
    const nextAction = new Promise((resolve, reject) => {
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
    this.inProgress = this.inProgress.then(_ => nextAction);
    return this.inProgress;
  }

  // Get block height
  getBlockHeight() {
    return this.chain.length - 1;
  }

  // get block
  getBlock(blockHeight) {
    // Get data from levelDB with key
    return new Promise((resolve, reject) => {
      db.get(blockHeight, (err, value) => {
        if (err) {
          if (err.notFound)
            return reject(`Error! Did not find block ${blockHeight}.`, err);
          return reject(`Error! Finding block ${blockHeight}`, err);
        }
        const block = JSON.parse(value);
        return resolve(block);
      });
    });
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

module.exports = {
  Block,
  Blockchain,
  chainDB
};
