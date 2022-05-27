// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract SweepStake is VRFConsumerBaseV2, KeeperCompatibleInterface {
    struct SingleSweepStake {
        uint32 maximumNoOfWinners;
        uint256 numberOfEntrants;
        uint256 startDateTime;
        uint256 endDateTime;
        uint256 amount;
        address token;
        string title;
        bool isActive;
        address[] entrants;
        address[] winners;
    }

    // SweepStake Variables
    mapping(uint256 => uint256) private requestIdToSweepStakerList;
    mapping(address => uint256[]) private stakerSweepStakeIndexMapping; // mapping staker's address -> index of sweepStakes
    mapping(address => uint256[]) private entrantSweepStakeIndexMapping; // mapping entrant's address -> index of sweepStakes
    // mapping entrants address -> index of sweepStakes -> boolean indication entrance
    // (this prevents looping through entrantSweepStakeIndexMapping)
    mapping(address => mapping(uint256 => bool))
        private entrantsSweepStakeMapping;
    // mapping(address => address) public tokenPriceFeedMapping;

    address[] private s_allowedTokens; // array of allowed tokens
    SingleSweepStake[] private s_sweepStakes; // list of all created sweep stakes
    //address[] private s_unique_stakers; // list of all stakers
    address private immutable _owner;

    /* Events */
    event NewSweepStakeAdded(
        address indexed createdBy,
        uint256 indexed sweepStakeIndex
    );
    event NewEntrantJoinedSweepStake(
        address indexed entrant,
        uint256 indexed sweepStakeIndex
    );
    event SweepStakeWinnersRequested(
        uint256 indexed requestId,
        uint256 indexed sweepStakeIndex
    );
    event SweepStakeTransferToWinnerSuccess(
        address indexed winnerAddress,
        uint256 indexed amount,
        uint256 indexed sweepStakeIndex
    );
    event SweepStakeWinnersPicked(
        uint256 indexed amount,
        uint256 indexed sweepStakeIndex
    );

    /* State variables */
    // Chainlink VRF Variables
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    constructor(
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gasLane, // keyHash
        uint32 callbackGasLimit
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        _owner = msg.sender;
    }

    modifier onlyOwner() {
        require(_owner == msg.sender, "Ownable: caller is not the owner");
        _;
    }

    function joinAsEntrant(uint256 sweepStakesIndex) public {
        require(
            !(sweepStakesIndex >= s_sweepStakes.length),
            "SweepStake: invalid index"
        );
        SingleSweepStake memory selectedSingleSweepStake = s_sweepStakes[
            sweepStakesIndex
        ];

        bool hasAlreadyJoinedStake = entrantsSweepStakeMapping[msg.sender][
            sweepStakesIndex
        ];

        require(!hasAlreadyJoinedStake, "SweepStake: already joined");

        require(
            !(block.timestamp <= selectedSingleSweepStake.startDateTime),
            "SweepStake: has not started"
        );

        require(
            !(block.timestamp >= selectedSingleSweepStake.endDateTime),
            "SweepStake: has ended"
        );
        require(selectedSingleSweepStake.isActive, "SweepStake: not active");

        s_sweepStakes[sweepStakesIndex].entrants.push(msg.sender);
        entrantsSweepStakeMapping[msg.sender][sweepStakesIndex] = true;
        entrantSweepStakeIndexMapping[msg.sender].push(sweepStakesIndex);
        emit NewEntrantJoinedSweepStake(msg.sender, sweepStakesIndex);
    }

    function createSweepStake(
        uint32 _maximumNoOfWinners,
        uint256 _startDateTime,
        uint256 _endDateTime,
        uint256 _amount,
        string memory _title,
        address _token
    ) public {
        require(!(_amount <= 0), "SweepStake: amount too small");

        require(
            checkIfTokenIsSupported(_token),
            "SweepStake: token not supported"
        );
        require(
            !(_startDateTime >= _endDateTime),
            "SweepStake: end dateTime is lower than start dateTime"
        );

        require(
            !(block.timestamp >= _startDateTime),
            "SweepStake: start dateTime is lower than current block dateTime"
        );
        require(
            !(_maximumNoOfWinners <= 0),
            "SweepStake: maximum number of winners less than one"
        );

        // transfer specified token funds from staker wallet to contract
        IERC20(_token).transferFrom(msg.sender, address(this), _amount);

        // only add the address as part of stakers if they have not staked before
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
                isActive: true,
                entrants: new address[](0),
                winners: new address[](0)
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

    function initiateSelectionOfWinners(uint256 _sweepStakeIndex)
        public
        onlyOwner
    {
        SingleSweepStake memory selectedSingleSweepStake = s_sweepStakes[
            _sweepStakeIndex
        ];

        require(
            !(block.timestamp <= selectedSingleSweepStake.startDateTime),
            "SweepStake: has not started"
        );
        require(
            selectedSingleSweepStake.endDateTime <= block.timestamp,
            "SweepStake: has not ended"
        );
        require(selectedSingleSweepStake.isActive, "SweepStake: not active");

        s_sweepStakes[_sweepStakeIndex].isActive = false;

        uint256 requestId;

        if (
            selectedSingleSweepStake.maximumNoOfWinners <
            selectedSingleSweepStake.entrants.length
        ) {
            requestId = i_vrfCoordinator.requestRandomWords(
                i_gasLane,
                i_subscriptionId,
                REQUEST_CONFIRMATIONS,
                i_callbackGasLimit,
                selectedSingleSweepStake.maximumNoOfWinners
            );
        } else {
            requestId = i_vrfCoordinator.requestRandomWords(
                i_gasLane,
                i_subscriptionId,
                REQUEST_CONFIRMATIONS,
                i_callbackGasLimit,
                uint32(selectedSingleSweepStake.entrants.length)
            );
        }
        requestIdToSweepStakerList[requestId] = _sweepStakeIndex;
        emit SweepStakeWinnersRequested(requestId, _sweepStakeIndex);
    }

    function checkUpkeep(
        bytes memory /* checkData */
    )
        public
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        uint256 resultCount;
        for (
            uint256 _sweepStakeIndex = 0;
            _sweepStakeIndex < s_sweepStakes.length;
            _sweepStakeIndex++
        ) {
            SingleSweepStake memory selectedSingleSweepStake = s_sweepStakes[
                _sweepStakeIndex
            ];
            bool isActive = selectedSingleSweepStake.isActive;
            bool timePassed = selectedSingleSweepStake.endDateTime <
                block.timestamp;
            if (isActive && timePassed) {
                resultCount++;
            }
        }
        uint256[] memory listOfSweepStakesThatNeedsAttention = new uint256[](
            resultCount
        );
        uint256 j;
        for (
            uint256 _sweepStakeIndex = 0;
            _sweepStakeIndex < s_sweepStakes.length;
            _sweepStakeIndex++
        ) {
            SingleSweepStake memory selectedSingleSweepStake = s_sweepStakes[
                _sweepStakeIndex
            ];
            bool isActive = selectedSingleSweepStake.isActive;
            bool timePassed = selectedSingleSweepStake.endDateTime <
                block.timestamp;
            if (isActive && timePassed) {
                listOfSweepStakesThatNeedsAttention[j] = _sweepStakeIndex;
                j++;
            }
        }
        upkeepNeeded = listOfSweepStakesThatNeedsAttention.length > 0;
        return (upkeepNeeded, abi.encode(listOfSweepStakesThatNeedsAttention)); // can we comment this out?
    }

    function performUpkeep(bytes calldata performData) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        require(upkeepNeeded, "Upkeep not needed");

        uint256[] memory listOfSweepStakesThatNeedsAttention;

        listOfSweepStakesThatNeedsAttention = abi.decode(
            performData,
            (uint256[])
        );

        for (
            uint256 index = 0;
            index < listOfSweepStakesThatNeedsAttention.length;
            index++
        ) {
            initiateSelectionOfWinners(
                listOfSweepStakesThatNeedsAttention[index]
            );
        }
    }

    /**
     * @dev This is the function that Chainlink VRF node
     * calls to send select winners and send money to the random winners.
     */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords)
        internal
        override
    {
        uint256 sweepStakeIndex = requestIdToSweepStakerList[requestId];
        SingleSweepStake memory selectedSingleSweepStake = s_sweepStakes[
            sweepStakeIndex
        ];

        address[] memory entrants = selectedSingleSweepStake.entrants;
        uint256 dividend;
        // uint256 dividend = (selectedSingleSweepStake.amount /
        //     selectedSingleSweepStake.maximumNoOfWinners);
        if (
            selectedSingleSweepStake.maximumNoOfWinners <
            selectedSingleSweepStake.entrants.length
        ) {
            dividend = (selectedSingleSweepStake.amount /
                selectedSingleSweepStake.maximumNoOfWinners);
            // (10**18);
        } else {
            dividend = (selectedSingleSweepStake.amount /
                selectedSingleSweepStake.entrants.length);
            // (10**18);
        }

        for (
            uint256 randomWordsIndex = 0;
            randomWordsIndex < randomWords.length;
            randomWordsIndex++
        ) {
            uint256 indexOfWinner = randomWords[randomWordsIndex] %
                entrants.length;
            // address payable winner = payable(entrants[indexOfWinner]);
            address winner = entrants[indexOfWinner];

            bool success = IERC20(selectedSingleSweepStake.token).transfer(
                winner,
                dividend
            );

            if (success) {
                s_sweepStakes[sweepStakeIndex].winners.push(winner);
                emit SweepStakeTransferToWinnerSuccess(
                    winner,
                    dividend,
                    sweepStakeIndex
                );
            }
        }

        emit SweepStakeWinnersPicked(dividend, sweepStakeIndex);
    }

    /* Setters and Getters */

    function addressBalance() public view returns (uint256) {
        return address(this).balance;
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

    function getAllSweepStakes()
        public
        view
        returns (SingleSweepStake[] memory)
    {
        return s_sweepStakes;
    }

    function getAllAllowedTokens() public view returns (address[] memory) {
        return s_allowedTokens;
    }
}
