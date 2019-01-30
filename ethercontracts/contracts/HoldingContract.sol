pragma solidity >=0.4.22 <0.6.0;

contract HoldingContract {   

    address[] public execplayers;
    address[] private winners;
    address public owner;

    struct Player {
        uint256 amountBet;
        uint gameId;
        uint sideId;
    }
    // The address of the player and => the user info
    mapping(address => Player) public execution;    

    constructor() public{
        owner = msg.sender;
    }

    function getowner() public view returns(address contractowner){
        return owner;
    }

    function getplayeramount(address player) public view returns(uint256 info){        
        return execution[player].amountBet;
    }


    function () external payable {}    

    /*
        msg.sender and msg.value are implicitly available, contain information
        about the adress of a caller and amount of ether they sent with the call (in wei)
    */
    function deposit(uint _gameId, uint _sideId) public payable returns(bool success) {
        
        if(!checkPlayerExists(msg.sender))
            execplayers.push(msg.sender);
            
        execution[msg.sender].amountBet += msg.value;
        execution[msg.sender].gameId = _gameId;
        execution[msg.sender].sideId = _sideId;
        
        return true;
    }

    /*function balancechk(address who, uint arr) public view returns(uint256 amt){
        return execution[who].amountBet;        
    }*/
    
    function reset() private returns(bool success){
        for (uint256 j = 0; j < execplayers.length; j++) {
            address playerexec = execplayers[j];
            delete execution[playerexec];
        }
        execplayers.length = 0;
        return true;
    }

    function checkPlayerExists(address player) public view returns(bool) {
        for (uint256 i = 0; i < execplayers.length; i++) {
            if (execplayers[i] == player) return true;
        }
        return false;
    }

}