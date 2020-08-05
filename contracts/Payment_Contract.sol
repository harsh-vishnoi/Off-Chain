pragma solidity ^0.5.16;

contract Payment_Contract {
    address payable public sender;
    address payable public recipient;
    uint256 public expiration;

    event joinEvent(address add);

    mapping(uint256 => bool) usedNonces;

    constructor(uint256 duration) public payable {
        sender = msg.sender;
        expiration = now + duration;
    }

    function joinContract() public {
        require(msg.sender != sender);
        recipient = msg.sender;
        emit joinEvent(recipient);
    }

    function isValidSignature(uint256 amount, address recipient, uint256 nonce, bytes memory signature) internal view returns (bool){
        bytes32 message = prefixed(keccak256(abi.encode(recipient, amount, nonce, this)));
        return recoverSigner(message, signature) == sender;
    }

    function close(uint256 amount, uint256 nonce, bytes memory signature) public {
        require(msg.sender == recipient);
        require(isValidSignature(amount, recipient, nonce, signature));

        recipient.transfer(amount);
        selfdestruct(sender);
    }

    function extend(uint256 newExpiration) public {
        require(msg.sender == sender);
        require(newExpiration > expiration);

        expiration = newExpiration;
    }

    function claimTimeout(address payable sender) public {
        require(now >= expiration);
        selfdestruct(sender);
    }

    function splitSignature(bytes memory sig) internal pure returns (uint8, bytes32, bytes32){
        require(sig.length == 65);

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }

        return (v, r, s);
    }

    function recoverSigner(bytes32 message, bytes memory sig) internal pure returns (address){
        uint8 v;
        bytes32 r;
        bytes32 s;

        (v, r, s) = splitSignature(sig);

        return ecrecover(message, v, r, s);
    }

    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encode("\x19Ethereum Signed Message:\n32", hash));
    }
}
