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
    this.inProgress = this.inProgress
      .then(() => this.getHeight())
      .catch(e => console.error("Failed getting height.", e));
    this.inProgress = this.inProgress
      .then(
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
                  console.error("Failed adding genisis block.", e);
                  return reject(e);
                });
            } else {
              const height = this.height - 1;
              this.getBlockP(height)
                .then(block => {
                  this.previousHash = block.hash;
                  return resolve();
                })
                .catch(e => {
                  console.error("Failed resolving last block.", e);
                  return reject(e);
                });
            }
          })
      )
      .catch(e => console.error("Failed setting up initial chain.", e));
  }

  finishActions() {
    return this.inProgress;
  }

  // Add new block
  addBlock(block) {
    if (block.constructor.name !== "Block") {
      console.error(`Invalid block type.`);
      return;
    }
    this.inProgress = this.inProgress
      .then(() => this.addBlockPromise(block))
      .catch(e => console.error("Failed adding block.", e));
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
          console.error(
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

  show() {
    this.inProgress = this.inProgress
      .then(
        () =>
          new Promise((resolveOuter, rejectOuter) => {
            for (let height = 0; height < this.height; height++) {
              this.inProgress = this.inProgress
                .then(
                  () =>
                    new Promise((resolve, reject) => {
                      db.get(height)
                        .then(block => {
                          console.log(block);
                          resolve();
                        })
                        .catch(e => {
                          console.error(`Failed show block.`, e);
                          reject();
                        });
                    })
                )
                .catch(e => {
                  console.error(`Failed show block loop.`, e);
                  rejectOuter();
                });
            }
            resolveOuter();
          })
      )
      .catch(e => console.error("Failed showing blockchain."));
  }

  // Get block height
  getBlockHeight() {
    this.inProgress
      .then(
        () =>
          new Promise((resolve, reject) =>
            console.log(`Height = ${this.height}`)
          )
      )
      .catch(e => console.error(`Failed getting block height.`));
  }

  // get block
  getBlock(blockHeight) {
    this.inProgress
      .then(
        () =>
          new Promise((resolve, reject) => {
            this.getBlockP(blockHeight)
              .then(block => {
                console.log(
                  `Block ${blockHeight} => ${JSON.stringify(block)}.`
                );
                return resolve();
              })
              .catch(e => {
                console.error(`Failed getting block ${blockHeight}.`);
                return reject();
              });
          })
      )
      .catch(e => console.error(`Failed getting block.`));
  }

  // get block
  getBlockP(blockHeight) {
    // Get data from levelDB with key
    return new Promise((resolve, reject) => {
      db.get(blockHeight, (err, value) => {
        if (err) {
          if (err.notFound)
            console.error(`Error! Did not find block ${blockHeight}.`);
          console.error(`Error! Finding block ${blockHeight}`);
          return reject(err);
        }
        const block = JSON.parse(value);
        return resolve(block);
      });
    });
  }

  // validate block
  validateBlock(height, errorLog, showConsoleLogs = true) {
    this.inProgress = this.inProgress
      .then(() => this.validateBlockP(height, errorLog, showConsoleLogs))
      .catch(e => console.error(`Failed block ${height} validation`));
  }

  // validate block
  validateBlockP(height, errorLog, showConsoleLogs = true) {
    return new Promise((resolve, reject) => {
      this.getBlockP(height)
        .then(block => {
          // get block hash
          let blockHash = block.hash;
          // remove block hash to test block integrity
          block.hash = "";
          // generate block hash
          let validBlockHash = SHA256(JSON.stringify(block)).toString();
          // restore the hash post hash calculation
          block.hash = blockHash;
          // Compare
          if (blockHash === validBlockHash) {
            if (showConsoleLogs) console.log(`Block ${height} validated.`);
            return resolve({ valid: true, block });
          } else {
            const msg = `Block ${
              block.height
            } invalid hash (saw <> expected):\n ${blockHash} \n<>\n ${validBlockHash}`;
            if (errorLog) errorLog.push(msg);
            if (showConsoleLogs) console.error(msg);
            return resolve({ valid: false, block });
          }
        })
        .catch(e => {
          console.error(`Failed block ${height} validation.`, e);
          reject(height);
        });
    });
  }

  // Validate blockchain
  validateChain() {
    this.inProgress = this.inProgress
      .then(() => {
        let errorLog = [];
        this.previousBlock = null;
        for (let height = 0; height <= this.height; height++) {
          this.inProgress = this.inProgress.then(() => {
            if (height < this.height) {
              return new Promise((resolve, reject) => {
                this.validateBlockP(height, errorLog, false)
                  .then(({ valid, block }) => {
                    if (
                      this.previousBlock &&
                      this.previousBlock.hash !== block.previousBlockHash
                    )
                      errorLog.push(
                        `Block ${
                          block.height
                        } invalid previousBlockHash (saw <> expected):\n${
                          block.previousBlockHash
                        } <> ${this.previousBlock.hash}`
                      );
                    this.previousBlock = block;
                    return resolve();
                  })
                  .catch(e => {
                    console.error(`Failed verifying block ${height}.`, e);
                    return reject(e);
                  });
              });
            } else {
              return new Promise((resolve, reject) => {
                if (!errorLog.length) {
                  console.log("No errors found in blockchain.");
                  return resolve();
                }
                errorLog.forEach(e => console.error(e));
                return resolve();
              });
            }
          });
        }
      })
      .catch(e => console.error("Failed validating chain.", e));
  }

  induceErrorData(height, data) {
    this.inProgress = this.inProgress
      .then(
        () =>
          new Promise((resolve, reject) => {
            this.getBlockP(height)
              .then(block => {
                block.data = data;
                db.put(height, JSON.stringify(block), err => {
                  if (err) {
                    console.error(
                      `Failed inducing block ${block.height} data error => ${
                        block.body
                      }.`,
                      err
                    );
                    return reject(err);
                  }
                  return resolve(block);
                });
              })
              .catch(e => {
                console.error(`Failed getting block ${height}.`, e);
                return reject(e);
              });
          })
      )
      .catch(e =>
        console.error(
          `Failed inducing data error at block ${height} with data => ${data}.`,
          e
        )
      );
  }
}

module.exports = {
  Block,
  Blockchain,
  chainDB
};
