pragma solidity >= 0.7.0 < 0.9.0;
// SPDX-License-Identifier: UNLICENSED
contract Counter {
    uint256 counter = 0;

    function add() public {
        counter++;
    }

    function subtract() public {
        counter--;
    }

    function getCounter() public view returns (uint256) {
        return counter;
    }
}
