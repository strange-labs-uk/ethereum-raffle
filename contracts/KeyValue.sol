pragma solidity ^0.4.21;

import "zeppelin-solidity/contracts/math/SafeMath.sol";

contract KeyValue {

    using SafeMath for uint256;

    struct KeyValues
    {
        string key;
        string value;
    }

    mapping (address => KeyValues) allValues;

    event ValueUpdated(
        address senderAddress,
        string key, 
        string value
    );

    function setValue(string key, string value)
        public
        returns (string, string)
    {

        KeyValues storage userValues = allValues[msg.sender];

        userValues.key = key;
        userValues.value = value;

        emit ValueUpdated(msg.sender, key, value);

        return (key, value);
    }

    function getValue() 
        public
        view
        returns (string, string)
    {
        KeyValues storage userValues = allValues[msg.sender];
        return (userValues.key, userValues.value);
    }
}
