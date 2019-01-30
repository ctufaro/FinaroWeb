var HoldingContract = artifacts.require("./HoldingContract");
var BettingContract = artifacts.require("./Betting");

module.exports = function(deployer) {
  deployer.deploy(HoldingContract);
  deployer.deploy(BettingContract);
}
