// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

error SweepStake__amountToSmall();
error SweepStake__tokenNotSupported();
error SweepStake__endDateTimeLowerThanStartDateTime();
error SweepStake__maximumNoOfWinnerLessThanOne();
error SweepStake__invalidSweepStakeIndex();
error SweepStake__hasAlreadyJoined();
error SweepStake__isNotActive();
error SweepStake__hasNotStarted();
error SweepStake__hasEnded();
error SweepStake__startDateTimeLowerThanCurrentBlockDateTime();
error SweepStake__endDateTimeLowerThanCurrentBlockDateTime();

contract SweepStake {
    struct SingleSweepStake {
        uint64 maximumNoOfWinners;
        uint256 numberOfEntrants;
        uint256 startDateTime;
        uint256 endDateTime;
        uint256 amount;
        address token;
        string title;
        bool isActive;
        address[] entrants;
    }

    // mapping staker's address -> index of sweepStakes
    mapping(address => uint256[]) private stakerSweepStakeIndexMapping;
    // mapping entrant's address -> index of sweepStakes
    mapping(address => uint256[]) private entrantSweepStakeIndexMapping;
    // mapping entrants address -> index of sweepStakes -> boolean indication entrance
    // (this prevents looping through entrantSweepStakeIndexMapping)
    mapping(address => mapping(uint256 => bool))
        private entrantsSweepStakeMapping;

    // array of allowed tokens
    address[] private s_allowedTokens;
    // list of all created sweep stakes
    SingleSweepStake[] private s_sweepStakes;
    // list of all stakers
    address[] private s_unique_stakers;

    event NewSweepStakeAdded(
        address indexed createdBy,
        uint256 indexed sweepStakeIndex
    );
    event NewEntrantJoinedSweepStake(
        address indexed entrant,
        uint256 indexed sweepStakeIndex
    );

    address private immutable _owner;

    constructor() {
        _owner = msg.sender;
    }

    modifier onlyOwner() {
        require(_owner == msg.sender, "Ownable: caller is not the owner");
        _;
    }

    function joinAsEntrant(uint256 sweepStakesIndex) public {
        if (sweepStakesIndex >= s_sweepStakes.length) {
            revert SweepStake__invalidSweepStakeIndex();
        }
        SingleSweepStake memory selectedSingleSweepStake = s_sweepStakes[
            sweepStakesIndex
        ];

        bool hasAlreadyJoinedStake = entrantsSweepStakeMapping[msg.sender][
            sweepStakesIndex
        ];

        if (_sweepStakeHasNotStarted(selectedSingleSweepStake)) {
            revert SweepStake__hasNotStarted();
        }
        if (_sweepStakeHasEnded(selectedSingleSweepStake)) {
            revert SweepStake__hasEnded();
        }
        if (!_sweepStakeIsActive(selectedSingleSweepStake)) {
            revert SweepStake__isNotActive();
        }

        if (hasAlreadyJoinedStake) {
            revert SweepStake__hasAlreadyJoined();
        }
        s_sweepStakes[sweepStakesIndex].entrants.push(msg.sender);
        entrantsSweepStakeMapping[msg.sender][sweepStakesIndex] = true;
        entrantSweepStakeIndexMapping[msg.sender].push(sweepStakesIndex);
        emit NewEntrantJoinedSweepStake(msg.sender, sweepStakesIndex);
    }

    function createSweepStake(
        uint64 _maximumNoOfWinners,
        uint256 _startDateTime,
        uint256 _endDateTime,
        uint256 _amount,
        string memory _title,
        address _token
    ) public {
        if (_amount <= 0) {
            revert SweepStake__amountToSmall();
        }
        if (!checkIfTokenIsSupported(_token)) {
            revert SweepStake__tokenNotSupported();
        }
        if (_startDateTime >= _endDateTime) {
            revert SweepStake__endDateTimeLowerThanStartDateTime();
        }
        if (block.timestamp >= _startDateTime) {
            revert SweepStake__startDateTimeLowerThanCurrentBlockDateTime();
        }
        if (block.timestamp >= _endDateTime) {
            revert SweepStake__endDateTimeLowerThanCurrentBlockDateTime();
        }
        if (_maximumNoOfWinners <= 0) {
            revert SweepStake__maximumNoOfWinnerLessThanOne();
        }

        // transfer specified token funds from staker wallet to contract
        // IERC20(_token).transferFrom(msg.sender, address(this), _amount);

        // only add the address as part of stakers if they have not staked before
        if (stakerSweepStakeIndexMapping[msg.sender].length <= 0) {
            s_unique_stakers.push(msg.sender);
        }
        stakerSweepStakeIndexMapping[msg.sender].push(s_sweepStakes.length);
        emit NewSweepStakeAdded(msg.sender, s_sweepStakes.length);
        s_sweepStakes.push(
            SingleSweepStake({
                maximumNoOfWinners: _maximumNoOfWinners,
                startDateTime: _startDateTime,
                endDateTime: _endDateTime,
                amount: _amount,
                token: _token,
                title: _title,
                numberOfEntrants: 0,
                isActive: false,
                entrants: new address[](0)
            })
        );
    }

    function checkIfTokenIsSupported(address _token)
        public
        view
        returns (bool)
    {
        bool tokenExists = false;
        for (
            uint256 tokenIndex = 0;
            tokenIndex < s_allowedTokens.length;
            tokenIndex++
        ) {
            if (s_allowedTokens[tokenIndex] == _token) {
                tokenExists = true;
                break;
            }
        }
        return tokenExists;
    }

    function addAllowedTokens(address _token) public onlyOwner {
        s_allowedTokens.push(_token);
    }

    function setSingleSweepStakeToActive(uint256 _sweepStakeIndex)
        public
        onlyOwner
    {
        s_sweepStakes[_sweepStakeIndex].isActive = true;
    }

    function getSweepStake(uint256 _sweepStakeIndex)
        public
        view
        returns (SingleSweepStake memory)
    {
        return s_sweepStakes[_sweepStakeIndex];
    }

    function getAllowedTokens(uint256 _allowedTokenindex)
        public
        view
        returns (address)
    {
        return s_allowedTokens[_allowedTokenindex];
    }

    function getStakerSweepStakesIndexes(address _stakerAddress)
        public
        view
        returns (uint256[] memory)
    {
        return stakerSweepStakeIndexMapping[_stakerAddress];
    }

    function getEntrantSweepStakeIndexMapping(address _entrantAddress)
        public
        view
        returns (uint256[] memory)
    {
        return entrantSweepStakeIndexMapping[_entrantAddress];
    }

    function getUniqueStaker() public view returns (address[] memory) {
        return s_unique_stakers;
    }

    function _sweepStakeHasNotStarted(
        SingleSweepStake memory selectedSingleSweepStake
    ) internal view returns (bool) {
        return block.timestamp <= selectedSingleSweepStake.startDateTime;
    }

    function _sweepStakeHasEnded(
        SingleSweepStake memory selectedSingleSweepStake
    ) internal view returns (bool) {
        return block.timestamp >= selectedSingleSweepStake.endDateTime;
    }

    function _sweepStakeIsActive(
        SingleSweepStake memory selectedSingleSweepStake
    ) internal pure returns (bool) {
        return selectedSingleSweepStake.isActive;
    }
}
