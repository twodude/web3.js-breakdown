let fs = require("fs");
let Web3 = require('web3'); // npm install web3@0.19

// Create a web3 connection to a running geth node over JSON-RPC running at
// http://localhost:8545
let web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));

// Read the compiled contract code
// Compile with
// build/solc/solc realEthash.sol --combined-json abi,asm,ast,bin,bin-runtime,devdoc,interface,opcodes,srcmap,srcmap-runtime,userdoc > contracts.json
let source = fs.readFileSync("./solexam/contracts.json");
let contracts = JSON.parse(source)["contracts"];

let abi = JSON.parse(contracts["realEthash.sol:realEthash"].abi); // ABI description as JSON structure
let code = '0x' + contracts["realEthash.sol:realEthash"].bin; // Smart contract EVM bytecode as hex

// Create Contract proxy class
let SampleContract = web3.eth.contract(abi);

// Unlock the coinbase account to make transactions out of it
const ADDRESS = "0x6282ad5f86c03726722ec397844d2f87ced3af89";
// const PRIVATE_KEY = "75F8343E57BD410673A4A770C25EA7651CB8CD6BC3068DDF915945BDA320A134";
// let privateKey = new Buffer(PRIVATE_KEY, 'hex')
console.log("Unlocking coinbase account");
var password = "12341234";
try {
  web3.personal.unlockAccount(ADDRESS, password);
} catch (e) {
  console.log(e);
  return;
}

console.log("Deploying the contract");
let contract = SampleContract.new({
  from: web3.eth.coinbase,
  gas: 1000000,
  data: code
});

// Transaction has entered to geth memory pool
console.log("Transaction Hash: \"" + contract.transactionHash + "\"");

// We need to wait until any miner has included the transaction
// in a block to get the address of the contract
async function waitBlock() {
  while (true) {
    let receipt = web3.eth.getTransactionReceipt(contract.transactionHash);
    if (receipt && receipt.contractAddress) {
      console.log("Contract Address: \"" + receipt.contractAddress + "\"");
      break;
    }
    console.log("Waiting a mined block to include your contract... latest block is " + web3.eth.blockNumber);
    await sleep(5000);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// main
waitBlock();
