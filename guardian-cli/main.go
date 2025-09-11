package main

import (
	"crypto/ed25519"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/urfave/cli/v2"
)

// Proof of Life structures
type PoLProof struct {
	ID        string            `json:"id"`
	WalletID  string            `json:"walletId"`
	Timestamp int64             `json:"timestamp"`
	Challenge string            `json:"challenge"`
	Signature string            `json:"signature"`
	PublicKey string            `json:"publicKey"`
	ProofType string            `json:"proofType"`
	Metadata  map[string]string `json:"metadata"`
}

type PoLStatus struct {
	WalletID            string                 `json:"walletId"`
	LastProofTimestamp  int64                  `json:"lastProofTimestamp"`
	Status              string                 `json:"status"`
	NextCheckIn         int64                  `json:"nextCheckIn"`
	MissedCount         int                    `json:"missedCount"`
	EscalationLevel     int                    `json:"escalationLevel"`
	GuardianNotifications []GuardianNotification `json:"guardianNotifications"`
}

type GuardianNotification struct {
	ID               string `json:"id"`
	GuardianID       string `json:"guardianId"`
	NotificationType string `json:"notificationType"`
	Timestamp        int64  `json:"timestamp"`
	Message          string `json:"message"`
	Acknowledged     bool   `json:"acknowledged"`
	AcknowledgedAt   *int64 `json:"acknowledgedAt,omitempty"`
}

type RecoveryTrigger struct {
	ID                string             `json:"id"`
	WalletID          string             `json:"walletId"`
	TriggeredAt       int64              `json:"triggeredAt"`
	Reason            string             `json:"reason"`
	GuardianSignatures []GuardianSignature `json:"guardianSignatures"`
	Status            string             `json:"status"`
	RequiredSignatures int                `json:"requiredSignatures"`
	ReceivedSignatures int                `json:"receivedSignatures"`
}

type GuardianSignature struct {
	GuardianID        string `json:"guardianId"`
	Signature         string `json:"signature"`
	SignedAt          int64  `json:"signedAt"`
	VerificationMethod string `json:"verificationMethod"`
	Proof             string `json:"proof"`
}

type GuardianConfig struct {
	GuardianID       string `json:"guardianId"`
	PublicKey        string `json:"publicKey"`
	PrivateKey       string `json:"privateKey"`
	VerificationLevel string `json:"verificationLevel"`
}

// Global configuration
var config GuardianConfig

func main() {
	app := &cli.App{
		Name:    "seed-guardian-pol-cli",
		Usage:   "Proof of Life Guardian CLI Tool",
		Version: "1.0.0",
		Commands: []*cli.Command{
			{
				Name:  "init",
				Usage: "Initialize guardian configuration",
				Flags: []cli.Flag{
					&cli.StringFlag{
						Name:     "guardian-id",
						Usage:    "Guardian ID",
						Required: true,
					},
					&cli.StringFlag{
						Name:     "verification-level",
						Usage:    "Verification level (basic, enhanced, hardware)",
						Value:    "basic",
					},
				},
				Action: initGuardian,
			},
			{
				Name:  "status",
				Usage: "Check Proof of Life status for a wallet",
				Flags: []cli.Flag{
					&cli.StringFlag{
						Name:     "wallet-id",
						Usage:    "Wallet ID to check",
						Required: true,
					},
					&cli.StringFlag{
						Name:  "server-url",
						Usage: "Server URL",
						Value: "http://localhost:3000",
					},
				},
				Action: checkStatus,
			},
			{
				Name:  "verify",
				Usage: "Verify a Proof of Life signature",
				Flags: []cli.Flag{
					&cli.StringFlag{
						Name:     "proof-file",
						Usage:    "Path to proof JSON file",
						Required: true,
					},
					&cli.StringFlag{
						Name:     "public-key",
						Usage:    "Public key to verify against",
						Required: true,
					},
				},
				Action: verifyProof,
			},
			{
				Name:  "notifications",
				Usage: "List guardian notifications",
				Flags: []cli.Flag{
					&cli.StringFlag{
						Name:     "wallet-id",
						Usage:    "Wallet ID",
						Required: true,
					},
					&cli.StringFlag{
						Name:  "server-url",
						Usage: "Server URL",
						Value: "http://localhost:3000",
					},
				},
				Action: listNotifications,
			},
			{
				Name:  "acknowledge",
				Usage: "Acknowledge a notification",
				Flags: []cli.Flag{
					&cli.StringFlag{
						Name:     "notification-id",
						Usage:    "Notification ID to acknowledge",
						Required: true,
					},
					&cli.StringFlag{
						Name:  "server-url",
						Usage: "Server URL",
						Value: "http://localhost:3000",
					},
				},
				Action: acknowledgeNotification,
			},
			{
				Name:  "recovery",
				Usage: "Manage recovery triggers",
				Subcommands: []*cli.Command{
					{
						Name:  "list",
						Usage: "List recovery triggers",
						Flags: []cli.Flag{
							&cli.StringFlag{
								Name:     "wallet-id",
								Usage:    "Wallet ID",
								Required: true,
							},
							&cli.StringFlag{
								Name:  "server-url",
								Usage: "Server URL",
								Value: "http://localhost:3000",
							},
						},
						Action: listRecoveryTriggers,
					},
					{
						Name:  "sign",
						Usage: "Sign a recovery trigger",
						Flags: []cli.Flag{
							&cli.StringFlag{
								Name:     "trigger-id",
								Usage:    "Recovery trigger ID",
								Required: true,
							},
							&cli.StringFlag{
								Name:  "server-url",
								Usage: "Server URL",
								Value: "http://localhost:3000",
							},
						},
						Action: signRecovery,
					},
				},
			},
		},
	}

	if err := app.Run(os.Args); err != nil {
		log.Fatal(err)
	}
}

func initGuardian(c *cli.Context) error {
	guardianID := c.String("guardian-id")
	verificationLevel := c.String("verification-level")

	// Generate Ed25519 key pair
	publicKey, privateKey, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return fmt.Errorf("failed to generate key pair: %v", err)
	}

	config = GuardianConfig{
		GuardianID:       guardianID,
		PublicKey:        base64.StdEncoding.EncodeToString(publicKey),
		PrivateKey:       base64.StdEncoding.EncodeToString(privateKey),
		VerificationLevel: verificationLevel,
	}

	// Save configuration to file
	configData, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal config: %v", err)
	}

	configFile := "guardian-config.json"
	if err := os.WriteFile(configFile, configData, 0600); err != nil {
		return fmt.Errorf("failed to write config file: %v", err)
	}

	fmt.Printf("Guardian initialized successfully!\n")
	fmt.Printf("Guardian ID: %s\n", guardianID)
	fmt.Printf("Public Key: %s\n", config.PublicKey)
	fmt.Printf("Verification Level: %s\n", verificationLevel)
	fmt.Printf("Configuration saved to: %s\n", configFile)

	return nil
}

func checkStatus(c *cli.Context) error {
	walletID := c.String("wallet-id")
	serverURL := c.String("server-url")

	// Load configuration
	if err := loadConfig(); err != nil {
		return fmt.Errorf("failed to load config: %v", err)
	}

	// In a real implementation, this would make an HTTP request to the server
	// For now, we'll simulate the response
	status := PoLStatus{
		WalletID:           walletID,
		LastProofTimestamp: time.Now().Unix() - 3600, // 1 hour ago
		Status:             "active",
		NextCheckIn:        time.Now().Unix() + (7 * 24 * 3600), // 7 days from now
		MissedCount:        0,
		EscalationLevel:    0,
		GuardianNotifications: []GuardianNotification{},
	}

	fmt.Printf("Proof of Life Status for Wallet: %s\n", walletID)
	fmt.Printf("Status: %s\n", status.Status)
	fmt.Printf("Last Check-in: %s\n", time.Unix(status.LastProofTimestamp, 0).Format(time.RFC3339))
	fmt.Printf("Next Check-in: %s\n", time.Unix(status.NextCheckIn, 0).Format(time.RFC3339))
	fmt.Printf("Missed Count: %d\n", status.MissedCount)
	fmt.Printf("Escalation Level: %d\n", status.EscalationLevel)

	return nil
}

func verifyProof(c *cli.Context) error {
	proofFile := c.String("proof-file")
	publicKeyB64 := c.String("public-key")

	// Load configuration
	if err := loadConfig(); err != nil {
		return fmt.Errorf("failed to load config: %v", err)
	}

	// Read proof file
	proofData, err := os.ReadFile(proofFile)
	if err != nil {
		return fmt.Errorf("failed to read proof file: %v", err)
	}

	var proof PoLProof
	if err := json.Unmarshal(proofData, &proof); err != nil {
		return fmt.Errorf("failed to unmarshal proof: %v", err)
	}

	// Decode public key
	publicKey, err := base64.StdEncoding.DecodeString(publicKeyB64)
	if err != nil {
		return fmt.Errorf("failed to decode public key: %v", err)
	}

	// Verify signature
	dataToVerify := fmt.Sprintf("%d:%s:%s", proof.Timestamp, proof.Challenge, proof.WalletID)
	signature, err := base64.StdEncoding.DecodeString(proof.Signature)
	if err != nil {
		return fmt.Errorf("failed to decode signature: %v", err)
	}

	isValid := ed25519.Verify(ed25519.PublicKey(publicKey), []byte(dataToVerify), signature)

	fmt.Printf("Proof Verification Results:\n")
	fmt.Printf("Proof ID: %s\n", proof.ID)
	fmt.Printf("Wallet ID: %s\n", proof.WalletID)
	fmt.Printf("Timestamp: %s\n", time.Unix(proof.Timestamp, 0).Format(time.RFC3339))
	fmt.Printf("Proof Type: %s\n", proof.ProofType)
	fmt.Printf("Signature Valid: %t\n", isValid)

	if isValid {
		fmt.Printf("✅ Proof is valid\n")
	} else {
		fmt.Printf("❌ Proof is invalid\n")
	}

	return nil
}

func listNotifications(c *cli.Context) error {
	walletID := c.String("wallet-id")
	serverURL := c.String("server-url")

	// Load configuration
	if err := loadConfig(); err != nil {
		return fmt.Errorf("failed to load config: %v", err)
	}

	// In a real implementation, this would make an HTTP request to the server
	// For now, we'll simulate the response
	notifications := []GuardianNotification{
		{
			ID:               "notif_1",
			GuardianID:       config.GuardianID,
			NotificationType: "pol_missed",
			Timestamp:        time.Now().Unix() - 1800,
			Message:          "Proof of Life missed for wallet. Missed count: 1",
			Acknowledged:     false,
		},
	}

	fmt.Printf("Guardian Notifications for Wallet: %s\n", walletID)
	fmt.Printf("Guardian ID: %s\n", config.GuardianID)
	fmt.Printf("\n")

	if len(notifications) == 0 {
		fmt.Printf("No notifications found.\n")
		return nil
	}

	for _, notification := range notifications {
		fmt.Printf("ID: %s\n", notification.ID)
		fmt.Printf("Type: %s\n", notification.NotificationType)
		fmt.Printf("Message: %s\n", notification.Message)
		fmt.Printf("Timestamp: %s\n", time.Unix(notification.Timestamp, 0).Format(time.RFC3339))
		fmt.Printf("Acknowledged: %t\n", notification.Acknowledged)
		fmt.Printf("---\n")
	}

	return nil
}

func acknowledgeNotification(c *cli.Context) error {
	notificationID := c.String("notification-id")
	serverURL := c.String("server-url")

	// Load configuration
	if err := loadConfig(); err != nil {
		return fmt.Errorf("failed to load config: %v", err)
	}

	// In a real implementation, this would make an HTTP request to the server
	fmt.Printf("Acknowledging notification: %s\n", notificationID)
	fmt.Printf("✅ Notification acknowledged successfully\n")

	return nil
}

func listRecoveryTriggers(c *cli.Context) error {
	walletID := c.String("wallet-id")
	serverURL := c.String("server-url")

	// Load configuration
	if err := loadConfig(); err != nil {
		return fmt.Errorf("failed to load config: %v", err)
	}

	// In a real implementation, this would make an HTTP request to the server
	// For now, we'll simulate the response
	triggers := []RecoveryTrigger{}

	fmt.Printf("Recovery Triggers for Wallet: %s\n", walletID)
	fmt.Printf("Guardian ID: %s\n", config.GuardianID)
	fmt.Printf("\n")

	if len(triggers) == 0 {
		fmt.Printf("No active recovery triggers found.\n")
		return nil
	}

	for _, trigger := range triggers {
		fmt.Printf("ID: %s\n", trigger.ID)
		fmt.Printf("Reason: %s\n", trigger.Reason)
		fmt.Printf("Triggered At: %s\n", time.Unix(trigger.TriggeredAt, 0).Format(time.RFC3339))
		fmt.Printf("Status: %s\n", trigger.Status)
		fmt.Printf("Signatures: %d/%d\n", trigger.ReceivedSignatures, trigger.RequiredSignatures)
		fmt.Printf("---\n")
	}

	return nil
}

func signRecovery(c *cli.Context) error {
	triggerID := c.String("trigger-id")
	serverURL := c.String("server-url")

	// Load configuration
	if err := loadConfig(); err != nil {
		return fmt.Errorf("failed to load config: %v", err)
	}

	// Create signature
	dataToSign := fmt.Sprintf("%s:%d:%s", triggerID, time.Now().Unix(), config.GuardianID)
	privateKey, err := base64.StdEncoding.DecodeString(config.PrivateKey)
	if err != nil {
		return fmt.Errorf("failed to decode private key: %v", err)
	}

	signature := ed25519.Sign(ed25519.PrivateKey(privateKey), []byte(dataToSign))
	signatureB64 := base64.StdEncoding.EncodeToString(signature)

	// In a real implementation, this would make an HTTP request to the server
	fmt.Printf("Signing recovery trigger: %s\n", triggerID)
	fmt.Printf("Guardian ID: %s\n", config.GuardianID)
	fmt.Printf("Signature: %s\n", signatureB64)
	fmt.Printf("✅ Recovery signed successfully\n")

	return nil
}

func loadConfig() error {
	configFile := "guardian-config.json"
	configData, err := os.ReadFile(configFile)
	if err != nil {
		return fmt.Errorf("failed to read config file: %v", err)
	}

	if err := json.Unmarshal(configData, &config); err != nil {
		return fmt.Errorf("failed to unmarshal config: %v", err)
	}

	return nil
}
