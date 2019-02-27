pragma solidity >=0.4.25 <0.6.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/SwayToken.sol";

contract TestSwayToken {

  function testInitialBalanceUsingDeployedContract() public {
    SwayToken sway = SwayToken(DeployedAddresses.SwayToken());

    uint expected = 100000000;

    Assert.equal(sway.balanceOf(msg.sender), expected, "Owner should have 100000000 SwayToken initially");
  }

}
