const ConvertLib = artifacts.require("ConvertLib");
const SwayToken = artifacts.require("SwayToken");

module.exports = function(deployer) {
  deployer.deploy(ConvertLib);
  deployer.link(ConvertLib, SwayToken);
  deployer.deploy(SwayToken);
};
