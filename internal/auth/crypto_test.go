package auth

import (
	"bytes"
	"encoding/base64"
	"strings"
	"sync"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
)

type CryptoSuite struct {
	suite.Suite
}

func TestCryptoSuite(t *testing.T) {
	suite.Run(t, new(CryptoSuite))
}

func (s *CryptoSuite) SetupTest() {
	// Reset globals between tests
	encryptionKey = nil
	keyInitErr = nil
	keyOnce = sync.Once{}
	// Clear env
	s.T().Setenv("TOKEN_SECRET", "")
}

// Helpers
func (s *CryptoSuite) genSecret32(byteVal byte) string {
	secretBytes := bytes.Repeat([]byte{byteVal}, 32)
	return base64.StdEncoding.EncodeToString(secretBytes)
}

func (s *CryptoSuite) mustSetSecret() string {
	secret := s.genSecret32(1)
	require.NoError(s.T(), SetTokenSecret(secret))
	return secret
}

/*
	SetTokenSecret tests
*/

func (s *CryptoSuite) TestSetTokenSecret_Success() {
	secret := s.genSecret32(9)
	err := SetTokenSecret(secret)
	require.NoError(s.T(), err)
	assert.Len(s.T(), encryptionKey, 32)
	assert.Nil(s.T(), keyInitErr)
}

func (s *CryptoSuite) TestSetTokenSecret_InvalidBase64() {
	err := SetTokenSecret("not-base64!!!")
	require.Error(s.T(), err)
	assert.Contains(s.T(), err.Error(), "failed to base64 decode provided secret")
}

func (s *CryptoSuite) TestSetTokenSecret_InvalidLength() {
	// 16 bytes instead of 32
	shortBytes := bytes.Repeat([]byte{2}, 16)
	short := base64.StdEncoding.EncodeToString(shortBytes)
	err := SetTokenSecret(short)
	require.Error(s.T(), err)
	assert.Contains(s.T(), err.Error(), "exactly 32 bytes")
}

/*
	initKeyFromEnv tests
*/

func (s *CryptoSuite) TestInitKeyFromEnv_EmptyEnv() {
	// Ensure reset
	encryptionKey = nil
	keyInitErr = nil
	keyOnce = sync.Once{}

	s.T().Setenv("TOKEN_SECRET", "")
	err := initKeyFromEnv()
	require.Error(s.T(), err)
	assert.Contains(s.T(), err.Error(), "TOKEN_SECRET env var is empty")
	assert.Nil(s.T(), encryptionKey)
}

func (s *CryptoSuite) TestInitKeyFromEnv_InvalidBase64() {
	encryptionKey = nil
	keyInitErr = nil
	keyOnce = sync.Once{}

	s.T().Setenv("TOKEN_SECRET", "###invalid###")
	err := initKeyFromEnv()
	require.Error(s.T(), err)
	assert.Contains(s.T(), err.Error(), "failed to base64 decode TOKEN_SECRET")
	assert.Nil(s.T(), encryptionKey)
}

func (s *CryptoSuite) TestInitKeyFromEnv_WrongLength() {
	encryptionKey = nil
	keyInitErr = nil
	keyOnce = sync.Once{}

	// 16 bytes
	short := base64.StdEncoding.EncodeToString(bytes.Repeat([]byte{3}, 16))
	s.T().Setenv("TOKEN_SECRET", short)
	err := initKeyFromEnv()
	require.Error(s.T(), err)
	assert.Contains(s.T(), err.Error(), "exactly 32 bytes")
	assert.Nil(s.T(), encryptionKey)
}

func (s *CryptoSuite) TestInitKeyFromEnv_Success() {
	encryptionKey = nil
	keyInitErr = nil
	keyOnce = sync.Once{}

	secret := s.genSecret32(4)
	s.T().Setenv("TOKEN_SECRET", secret)
	err := initKeyFromEnv()
	require.NoError(s.T(), err)
	require.Len(s.T(), encryptionKey, 32)

	// Subsequent call should no-op due to keyOnce
	err2 := initKeyFromEnv()
	require.NoError(s.T(), err2)
}

/*
	ensureKey tests
*/

func (s *CryptoSuite) TestEnsureKey_UsesExistingKey() {
	// Set via SetTokenSecret, then ensureKey should pass without env
	_ = s.mustSetSecret()
	s.T().Setenv("TOKEN_SECRET", "")
	err := ensureKey()
	require.NoError(s.T(), err)
}

func (s *CryptoSuite) TestEnsureKey_UsesEnvWhenNotSet() {
	// No pre-set key; ensureKey should read from env
	encryptionKey = nil
	keyInitErr = nil
	keyOnce = sync.Once{}

	secret := s.genSecret32(5)
	s.T().Setenv("TOKEN_SECRET", secret)
	err := ensureKey()
	require.NoError(s.T(), err)
	assert.Len(s.T(), encryptionKey, 32)
}

/*
	EncryptToken tests
*/

func (s *CryptoSuite) TestEncryptToken_RoundTrip() {
	_ = s.mustSetSecret()
	plaintext := "my-token-123"
	ciphertext, err := EncryptToken(plaintext)
	require.NoError(s.T(), err)
	require.NotEqual(s.T(), plaintext, ciphertext)
	require.True(s.T(), strings.HasPrefix(ciphertext, "enc:v1:"))

	decrypted, err := DecryptToken(ciphertext)
	require.NoError(s.T(), err)
	require.Equal(s.T(), plaintext, decrypted)
}

func (s *CryptoSuite) TestEncryptToken_ErrorWhenNoKey() {
	// No env and no SetTokenSecret
	encryptionKey = nil
	keyInitErr = nil
	keyOnce = sync.Once{}
	s.T().Setenv("TOKEN_SECRET", "")

	_, err := EncryptToken("plain")
	require.Error(s.T(), err)
	assert.Contains(s.T(), err.Error(), "TOKEN_SECRET env var is empty")
}

/*
	DecryptToken tests
*/

func (s *CryptoSuite) TestDecryptToken_PlaintextMissingPrefixError() {
	_ = s.mustSetSecret()

	plaintext := "plain-token"
	_, err := DecryptToken(plaintext)
	require.Error(s.T(), err)
	require.Contains(s.T(), err.Error(), "encrypted")
}

func (s *CryptoSuite) TestDecryptToken_Base64DecodeError() {
	_ = s.mustSetSecret()

	_, err := DecryptToken("enc:v1:!!!not-base64!!!")
	require.Error(s.T(), err)
	require.Contains(s.T(), err.Error(), "failed to base64 decode encrypted token")
}

func (s *CryptoSuite) TestDecryptToken_ShortPayloadError() {
	_ = s.mustSetSecret()

	short := base64.StdEncoding.EncodeToString([]byte{1, 2, 3, 4, 5})
	_, err := DecryptToken("enc:v1:" + short)
	require.Error(s.T(), err)
	require.Contains(s.T(), err.Error(), "invalid encrypted token payload")
}

func (s *CryptoSuite) TestDecryptToken_TamperedCiphertext() {
	_ = s.mustSetSecret()

	// Encrypt then tamper a byte in the payload to cause GCM decryption failure
	ct, err := EncryptToken("secret-plain")
	require.NoError(s.T(), err)
	require.True(s.T(), strings.HasPrefix(ct, "enc:v1:"))

	encoded := ct[len(encPrefix):]
	raw, err := base64.StdEncoding.DecodeString(encoded)
	require.NoError(s.T(), err)
	// Ensure length is sufficient (nonce + ciphertext), flip last byte
	require.Greater(s.T(), len(raw), gcmNonceLen)
	raw[len(raw)-1] ^= 0xFF

	tampered := encPrefix + base64.StdEncoding.EncodeToString(raw)
	_, err = DecryptToken(tampered)
	require.Error(s.T(), err)
	require.Contains(s.T(), err.Error(), "failed to decrypt token")
}
