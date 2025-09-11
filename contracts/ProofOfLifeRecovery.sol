// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ProofOfLifeRecovery
 * @dev Smart contract for time-based recovery with guardian multisig
 * @author Seed Guardian Safe Protocol
 */
contract ProofOfLifeRecovery {
    // Events
    event RecoveryTriggered(
        bytes32 indexed walletId,
        uint256 timestamp,
        string reason,
        uint256 requiredSignatures
    );
    
    event GuardianSigned(
        bytes32 indexed walletId,
        address indexed guardian,
        uint256 timestamp
    );
    
    event RecoveryExecuted(
        bytes32 indexed walletId,
        uint256 timestamp,
        address executor
    );
    
    event RecoveryCancelled(
        bytes32 indexed walletId,
        uint256 timestamp,
        address canceller
    );

    // Structs
    struct RecoveryRequest {
        bytes32 walletId;
        uint256 triggeredAt;
        string reason;
        uint256 requiredSignatures;
        uint256 receivedSignatures;
        bool executed;
        bool cancelled;
        mapping(address => bool) guardianSignatures;
        address[] signers;
    }

    struct Guardian {
        address guardianAddress;
        string publicKey;
        bool isActive;
        uint256 addedAt;
    }

    // State variables
    mapping(bytes32 => RecoveryRequest) public recoveryRequests;
    mapping(bytes32 => Guardian[]) public walletGuardians;
    mapping(bytes32 => uint256) public lastProofOfLife;
    mapping(bytes32 => uint256) public recoveryThreshold;
    
    address public owner;
    uint256 public defaultRecoveryThreshold = 30 days;
    uint256 public minimumGuardians = 2;
    uint256 public maximumGuardians = 10;

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyGuardian(bytes32 walletId) {
        bool isGuardian = false;
        Guardian[] storage guardians = walletGuardians[walletId];
        for (uint256 i = 0; i < guardians.length; i++) {
            if (guardians[i].guardianAddress == msg.sender && guardians[i].isActive) {
                isGuardian = true;
                break;
            }
        }
        require(isGuardian, "Only guardians can call this function");
        _;
    }

    modifier recoveryExists(bytes32 walletId) {
        require(recoveryRequests[walletId].triggeredAt > 0, "Recovery request does not exist");
        _;
    }

    modifier recoveryNotExecuted(bytes32 walletId) {
        require(!recoveryRequests[walletId].executed, "Recovery already executed");
        _;
    }

    modifier recoveryNotCancelled(bytes32 walletId) {
        require(!recoveryRequests[walletId].cancelled, "Recovery already cancelled");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Set up guardians for a wallet
     * @param walletId The wallet identifier
     * @param guardianAddresses Array of guardian addresses
     * @param publicKeys Array of guardian public keys
     */
    function setupGuardians(
        bytes32 walletId,
        address[] calldata guardianAddresses,
        string[] calldata publicKeys
    ) external onlyOwner {
        require(guardianAddresses.length == publicKeys.length, "Arrays length mismatch");
        require(guardianAddresses.length >= minimumGuardians, "Too few guardians");
        require(guardianAddresses.length <= maximumGuardians, "Too many guardians");
        
        // Clear existing guardians
        delete walletGuardians[walletId];
        
        // Add new guardians
        for (uint256 i = 0; i < guardianAddresses.length; i++) {
            require(guardianAddresses[i] != address(0), "Invalid guardian address");
            walletGuardians[walletId].push(Guardian({
                guardianAddress: guardianAddresses[i],
                publicKey: publicKeys[i],
                isActive: true,
                addedAt: block.timestamp
            }));
        }
        
        // Set default recovery threshold
        recoveryThreshold[walletId] = defaultRecoveryThreshold;
    }

    /**
     * @dev Update Proof of Life timestamp
     * @param walletId The wallet identifier
     * @param timestamp The timestamp of the proof
     */
    function updateProofOfLife(bytes32 walletId, uint256 timestamp) external onlyOwner {
        require(timestamp > lastProofOfLife[walletId], "Timestamp must be newer");
        lastProofOfLife[walletId] = timestamp;
    }

    /**
     * @dev Trigger recovery process
     * @param walletId The wallet identifier
     * @param reason The reason for recovery
     */
    function triggerRecovery(bytes32 walletId, string calldata reason) external onlyOwner {
        require(walletGuardians[walletId].length > 0, "No guardians set up");
        require(recoveryRequests[walletId].triggeredAt == 0, "Recovery already triggered");
        
        // Check if enough time has passed since last proof of life
        uint256 timeSinceLastProof = block.timestamp - lastProofOfLife[walletId];
        require(timeSinceLastProof >= recoveryThreshold[walletId], "Recovery threshold not met");
        
        // Calculate required signatures (60% of guardians)
        uint256 requiredSignatures = (walletGuardians[walletId].length * 60) / 100;
        if (requiredSignatures == 0) {
            requiredSignatures = 1;
        }
        
        // Create recovery request
        RecoveryRequest storage request = recoveryRequests[walletId];
        request.walletId = walletId;
        request.triggeredAt = block.timestamp;
        request.reason = reason;
        request.requiredSignatures = requiredSignatures;
        request.receivedSignatures = 0;
        request.executed = false;
        request.cancelled = false;
        
        emit RecoveryTriggered(walletId, block.timestamp, reason, requiredSignatures);
    }

    /**
     * @dev Sign recovery request
     * @param walletId The wallet identifier
     */
    function signRecovery(bytes32 walletId) 
        external 
        onlyGuardian(walletId) 
        recoveryExists(walletId) 
        recoveryNotExecuted(walletId) 
        recoveryNotCancelled(walletId) 
    {
        RecoveryRequest storage request = recoveryRequests[walletId];
        require(!request.guardianSignatures[msg.sender], "Already signed");
        
        request.guardianSignatures[msg.sender] = true;
        request.receivedSignatures++;
        request.signers.push(msg.sender);
        
        emit GuardianSigned(walletId, msg.sender, block.timestamp);
        
        // Check if threshold is met
        if (request.receivedSignatures >= request.requiredSignatures) {
            _executeRecovery(walletId);
        }
    }

    /**
     * @dev Execute recovery (internal function)
     * @param walletId The wallet identifier
     */
    function _executeRecovery(bytes32 walletId) internal {
        RecoveryRequest storage request = recoveryRequests[walletId];
        request.executed = true;
        
        emit RecoveryExecuted(walletId, block.timestamp, msg.sender);
        
        // Here you would implement the actual recovery logic
        // For example, releasing encrypted keys, transferring funds, etc.
        // This is a placeholder - implement according to your specific needs
    }

    /**
     * @dev Cancel recovery request
     * @param walletId The wallet identifier
     */
    function cancelRecovery(bytes32 walletId) 
        external 
        onlyGuardian(walletId) 
        recoveryExists(walletId) 
        recoveryNotExecuted(walletId) 
        recoveryNotCancelled(walletId) 
    {
        RecoveryRequest storage request = recoveryRequests[walletId];
        request.cancelled = true;
        
        emit RecoveryCancelled(walletId, block.timestamp, msg.sender);
    }

    /**
     * @dev Set recovery threshold for a wallet
     * @param walletId The wallet identifier
     * @param threshold The threshold in seconds
     */
    function setRecoveryThreshold(bytes32 walletId, uint256 threshold) external onlyOwner {
        require(threshold >= 1 days, "Threshold too short");
        require(threshold <= 365 days, "Threshold too long");
        recoveryThreshold[walletId] = threshold;
    }

    /**
     * @dev Add a guardian to a wallet
     * @param walletId The wallet identifier
     * @param guardianAddress The guardian address
     * @param publicKey The guardian's public key
     */
    function addGuardian(
        bytes32 walletId, 
        address guardianAddress, 
        string calldata publicKey
    ) external onlyOwner {
        require(guardianAddress != address(0), "Invalid guardian address");
        require(walletGuardians[walletId].length < maximumGuardians, "Too many guardians");
        
        walletGuardians[walletId].push(Guardian({
            guardianAddress: guardianAddress,
            publicKey: publicKey,
            isActive: true,
            addedAt: block.timestamp
        }));
    }

    /**
     * @dev Remove a guardian from a wallet
     * @param walletId The wallet identifier
     * @param guardianIndex The index of the guardian to remove
     */
    function removeGuardian(bytes32 walletId, uint256 guardianIndex) external onlyOwner {
        require(guardianIndex < walletGuardians[walletId].length, "Invalid guardian index");
        require(walletGuardians[walletId].length > minimumGuardians, "Too few guardians");
        
        walletGuardians[walletId][guardianIndex].isActive = false;
    }

    /**
     * @dev Get recovery request details
     * @param walletId The wallet identifier
     * @return triggeredAt The timestamp when recovery was triggered
     * @return reason The reason for recovery
     * @return requiredSignatures The number of required signatures
     * @return receivedSignatures The number of received signatures
     * @return executed Whether recovery has been executed
     * @return cancelled Whether recovery has been cancelled
     */
    function getRecoveryRequest(bytes32 walletId) 
        external 
        view 
        returns (
            uint256 triggeredAt,
            string memory reason,
            uint256 requiredSignatures,
            uint256 receivedSignatures,
            bool executed,
            bool cancelled
        ) 
    {
        RecoveryRequest storage request = recoveryRequests[walletId];
        return (
            request.triggeredAt,
            request.reason,
            request.requiredSignatures,
            request.receivedSignatures,
            request.executed,
            request.cancelled
        );
    }

    /**
     * @dev Get guardians for a wallet
     * @param walletId The wallet identifier
     * @return addresses Array of guardian addresses
     * @return publicKeys Array of guardian public keys
     * @return active Array of guardian active status
     */
    function getGuardians(bytes32 walletId) 
        external 
        view 
        returns (
            address[] memory addresses,
            string[] memory publicKeys,
            bool[] memory active
        ) 
    {
        Guardian[] storage guardians = walletGuardians[walletId];
        addresses = new address[](guardians.length);
        publicKeys = new string[](guardians.length);
        active = new bool[](guardians.length);
        
        for (uint256 i = 0; i < guardians.length; i++) {
            addresses[i] = guardians[i].guardianAddress;
            publicKeys[i] = guardians[i].publicKey;
            active[i] = guardians[i].isActive;
        }
    }

    /**
     * @dev Check if an address is a guardian for a wallet
     * @param walletId The wallet identifier
     * @param guardianAddress The address to check
     * @return isGuardian Whether the address is a guardian
     */
    function isGuardian(bytes32 walletId, address guardianAddress) 
        external 
        view 
        returns (bool isGuardian) 
    {
        Guardian[] storage guardians = walletGuardians[walletId];
        for (uint256 i = 0; i < guardians.length; i++) {
            if (guardians[i].guardianAddress == guardianAddress && guardians[i].isActive) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Check if recovery can be triggered
     * @param walletId The wallet identifier
     * @return canTrigger Whether recovery can be triggered
     * @return timeRemaining Time remaining until recovery can be triggered
     */
    function canTriggerRecovery(bytes32 walletId) 
        external 
        view 
        returns (bool canTrigger, uint256 timeRemaining) 
    {
        if (walletGuardians[walletId].length == 0) {
            return (false, 0);
        }
        
        if (recoveryRequests[walletId].triggeredAt > 0) {
            return (false, 0);
        }
        
        uint256 timeSinceLastProof = block.timestamp - lastProofOfLife[walletId];
        if (timeSinceLastProof >= recoveryThreshold[walletId]) {
            return (true, 0);
        } else {
            return (false, recoveryThreshold[walletId] - timeSinceLastProof);
        }
    }

    /**
     * @dev Get wallet status
     * @param walletId The wallet identifier
     * @return lastProof The timestamp of the last proof of life
     * @return guardianCount The number of guardians
     * @return recoveryThreshold The recovery threshold in seconds
     * @return hasActiveRecovery Whether there's an active recovery request
     */
    function getWalletStatus(bytes32 walletId) 
        external 
        view 
        returns (
            uint256 lastProof,
            uint256 guardianCount,
            uint256 recoveryThreshold,
            bool hasActiveRecovery
        ) 
    {
        lastProof = lastProofOfLife[walletId];
        guardianCount = walletGuardians[walletId].length;
        recoveryThreshold = recoveryThreshold[walletId];
        hasActiveRecovery = recoveryRequests[walletId].triggeredAt > 0 && 
                           !recoveryRequests[walletId].executed && 
                           !recoveryRequests[walletId].cancelled;
    }
}
