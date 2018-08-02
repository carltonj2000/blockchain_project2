"use strict";
/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/

const level = require("level");
const chainDB = "./blockchainDB";
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
    this.inProgress = this.inProgress.then(
      () =>
        new Promise((resolve, reject) => {
          if (this.height === 0) {
            this.addBlockPromise(
              new Block("First block in the chain - Genesis block")
            )
              .then(block => {
                this.previousHash = block.hash;
                this.height = block.height + 1;
                return resolve();
              })
              .catch(e => {
                console.log("Failed adding genisis block.", e);
                return reject(e);
              });
          } else {
            const height = this.height - 1;
            this.getBlock(height)
              .then(block => {
                this.previousHash = block.hash;
                return resolve();
              })
              .catch(e => {
                console.log("Failed resolving last block.", e);
                return reject(e);
              });
          }
        })
    );
  }

  finishActions() {
    return this.inProgress;
  }

  // Add new block
  addBlock(block) {
    this.inProgress = this.inProgress.then(() => this.addBlockPromise(block));
  }

  addBlockPromise(newBlock) {
    return new Promise((resolve, reject) => {
      // UTC timestamp
      newBlock.time = new Date()
        .getTime()
        .toString()
        .slice(0, -3);
      // Block height
      newBlock.height = this.height;
      debugger;
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
        return resolve(newBlock);
      });
    });
  }

  getHeight() {
    return new Promise((resolve, reject) => {
      let height = 0;
      db.createReadStream()
        .on("data", data => {
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
        try {
          await this.inProgress;
          for (let height = 0; height < this.height; height++) {
            const block = await db.get(height);
            console.log(block);
          }
          resolve();
        } catch (e) {
          console.log("Show blockchain failed!");
          reject();
        }
      })(resolve, reject);
    });
    this.inProgress = this.inProgress.then(_ => nextAction);
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
  validateBlock(block, errorLog) {
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
      errorLog.push(
        "Block #" +
          block.height +
          " invalid hash:\n" +
          blockHash +
          "\n<>\n" +
          validBlockHash
      );
      return false;
    }
  }

  // Validate blockchain
  validateChain() {
    this.inProgress = this.inProgress.then(
      () =>
        new Promise((resolve, reject) => {
          let height = 0;
          let previousBlock = null;
          let errorLog = [];
          do {
            this.getBlock(height).then(block => {
              this.validateBlock(block, errorLog);
              if (
                previousBlock &&
                previousBlock.hash !== block.previousBlockHash
              )
                errorLog.push(
                  "Block #" +
                    block.height +
                    " invalid previousBlockHash:\n" +
                    block.previousBlockHash
                );
            });
          } while (++height < this.height);
          if (!errorLog.length) {
            console.log("No errors found in blockchain.");
            return resolve();
          }
          errorLog.forEach(e => console.log(e));
          return resolve();
        })
    );
  }

  induceErrorData(height, data) {
    this.inProgress = this.inProgress.then(
      () =>
        new Promise((resolve, reject) => {
          this.getBlock(height).then(block => {
            block.data = data;
            db.put(height, JSON.stringify(block), err => {
              if (err) {
                console.log(
                  `Failed inducing block ${block.height} data error => ${
                    block.body
                  }.`,
                  err
                );
                return reject(err);
              }
              return resolve(block);
            });
          });
        })
    );
  }
}

module.exports = {
  Block,
  Blockchain,
  chainDB
};
