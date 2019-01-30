pragma solidity ^ 0.4.18;

contract ExecutingContract {    
    /*
        Maps account addresses to the amount of ether on their balance.
    */
    mapping (address => uint256) public balances;

    /*
        Used to load up test ether
    */
    function loadEth () public payable {}

    /*
        msg.sender and msg.value are implicitly available, contain information
        about the adress of a caller and amount of ether they sent with the call (in wei)
    */
    function deposit() public payable returns(bool success) {
        balances[msg.sender] += msg.value;
        return true;
    }
}