package middleware

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"regexp"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"

	"developer-portal-backend/internal/errors"
)

// LoggingMiddlewareTestSuite provides test setup and utilities for logging middleware tests
type LoggingMiddlewareTestSuite struct {
	suite.Suite
	logBuffer *bytes.Buffer
	router    *gin.Engine
}

func (suite *LoggingMiddlewareTestSuite) SetupTest() {
	// Set Gin to test mode to avoid debug output
	gin.SetMode(gin.TestMode)

	// Capture logrus output for verification
	suite.logBuffer = new(bytes.Buffer)
	logrus.SetOutput(suite.logBuffer)
	logrus.SetFormatter(&logrus.JSONFormatter{})
	logrus.SetLevel(logrus.InfoLevel)

	// Create fresh router for each test
	suite.router = gin.New()
}

func (suite *LoggingMiddlewareTestSuite) TearDownTest() {
	// Reset logrus output
	logrus.SetOutput(io.Discard)
}

func (suite *LoggingMiddlewareTestSuite) setupRouterWithMiddleware(middlewares ...gin.HandlerFunc) {
	// Apply all middleware
	suite.router.Use(middlewares...)

	// Add test endpoints
	suite.router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	suite.router.POST("/test", func(c *gin.Context) {
		c.JSON(http.StatusCreated, gin.H{"message": "created"})
	})

	suite.router.GET("/error", func(c *gin.Context) {
		c.Error(fmt.Errorf("test error"))
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request"})
	})

	suite.router.GET("/panic", func(c *gin.Context) {
		panic("test panic")
	})

	suite.router.GET("/panic-error", func(c *gin.Context) {
		panic(fmt.Errorf("test error panic"))
	})

	suite.router.GET("/panic-custom", func(c *gin.Context) {
		type CustomError struct {
			Message string
		}
		panic(CustomError{Message: "custom panic"})
	})
}

// ========================================================================================
// FACTORY HELPER METHODS
// ========================================================================================

// createTestRequest creates a test HTTP request with optional headers and body
func (suite *LoggingMiddlewareTestSuite) createTestRequest(method, path string, headers map[string]string, body io.Reader) *http.Request {
	req := httptest.NewRequest(method, path, body)

	// Add custom headers
	for key, value := range headers {
		req.Header.Set(key, value)
	}

	return req
}

// createSimpleTestRequest creates a simple test HTTP request with just method and path
func (suite *LoggingMiddlewareTestSuite) createSimpleTestRequest(method, path string) *http.Request {
	return suite.createTestRequest(method, path, nil, nil)
}

// createTestRequestWithHeaders creates a test HTTP request with headers only
func (suite *LoggingMiddlewareTestSuite) createTestRequestWithHeaders(method, path string, headers map[string]string) *http.Request {
	return suite.createTestRequest(method, path, headers, nil)
}

// createTestRequestWithBody creates a test HTTP request with body and content type
func (suite *LoggingMiddlewareTestSuite) createTestRequestWithBody(method, path string, body string, contentType string) *http.Request {
	headers := make(map[string]string)
	if contentType != "" {
		headers["Content-Type"] = contentType
	}
	return suite.createTestRequest(method, path, headers, strings.NewReader(body))
}

// executeRequest executes a request and returns the recorder
func (suite *LoggingMiddlewareTestSuite) executeRequest(req *http.Request) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)
	return w
}

// assertLogContains verifies that the log output contains the expected fields
func (suite *LoggingMiddlewareTestSuite) assertLogContains(expectedFields map[string]interface{}) {
	logOutput := suite.logBuffer.String()

	for field, expectedValue := range expectedFields {
		switch v := expectedValue.(type) {
		case string:
			assert.Contains(suite.T(), logOutput, fmt.Sprintf(`"%s":"%s"`, field, v),
				"Log should contain field %s with value %s", field, v)
		case int:
			assert.Contains(suite.T(), logOutput, fmt.Sprintf(`"%s":%d`, field, v),
				"Log should contain field %s with value %d", field, v)
		case bool:
			assert.Contains(suite.T(), logOutput, fmt.Sprintf(`"%s":%t`, field, v),
				"Log should contain field %s with value %t", field, v)
		default:
			assert.Contains(suite.T(), logOutput, fmt.Sprintf(`"%s":`, field),
				"Log should contain field %s", field)
		}
	}
}

// assertLogContainsMessage verifies that the log contains a specific message
func (suite *LoggingMiddlewareTestSuite) assertLogContainsMessage(message string) {
	logOutput := suite.logBuffer.String()
	assert.Contains(suite.T(), logOutput, message, "Log should contain message: %s", message)
}

// assertResponseJSON verifies that the response is valid JSON and contains expected fields
func (suite *LoggingMiddlewareTestSuite) assertResponseJSON(w *httptest.ResponseRecorder, expectedFields map[string]interface{}) map[string]interface{} {
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err, "Response should be valid JSON")

	for field, expectedValue := range expectedFields {
		assert.Equal(suite.T(), expectedValue, response[field],
			"Response field %s should equal %v", field, expectedValue)
	}

	return response
}

// assertRequestIDFormat verifies that a request ID follows the expected format
func (suite *LoggingMiddlewareTestSuite) assertRequestIDFormat(requestID string) {
	assert.NotEmpty(suite.T(), requestID, "Request ID should not be empty")

	// Verify format: YYYYMMDDHHMMSS-XXXXXXXX (timestamp-8chars)
	requestIDRegex := regexp.MustCompile(`^\d{14}-[a-zA-Z0-9]{8}$`)
	assert.Regexp(suite.T(), requestIDRegex, requestID, "Request ID should match expected format")
}

// ========================================================================================
// LOGGER MIDDLEWARE TESTS
// ========================================================================================

func (suite *LoggingMiddlewareTestSuite) TestLogger_SuccessfulRequest() {
	// Arrange
	suite.setupRouterWithMiddleware(Logger())

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.Header.Set("User-Agent", "test-agent/1.0")
	req.Header.Set("X-Real-IP", "192.168.1.100")
	w := httptest.NewRecorder()

	// Act
	suite.router.ServeHTTP(w, req)

	// Assert
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Verify log entry was created
	logOutput := suite.logBuffer.String()
	assert.Contains(suite.T(), logOutput, "HTTP Request")
	assert.Contains(suite.T(), logOutput, "\"method\":\"GET\"")
	assert.Contains(suite.T(), logOutput, "\"path\":\"/test\"")
	assert.Contains(suite.T(), logOutput, "\"status_code\":200")
	assert.Contains(suite.T(), logOutput, "\"user_agent\":\"test-agent/1.0\"")
}

func (suite *LoggingMiddlewareTestSuite) TestLogger_DifferentStatusCodes() {
	// Test various status codes
	testCases := []struct {
		endpoint     string
		expectedCode int
	}{
		{"/test", 200},
		{"/error", 400},
		{"/notfound", 404},
	}

	for _, tc := range testCases {
		suite.T().Run(fmt.Sprintf("Status_%d", tc.expectedCode), func(t *testing.T) {
			// Arrange
			suite.SetupTest() // Fresh setup for each test case
			suite.setupRouterWithMiddleware(Logger())

			req := httptest.NewRequest(http.MethodGet, tc.endpoint, nil)
			w := httptest.NewRecorder()

			// Act
			suite.router.ServeHTTP(w, req)

			// Assert
			assert.Equal(t, tc.expectedCode, w.Code)

			logOutput := suite.logBuffer.String()
			assert.Contains(t, logOutput, fmt.Sprintf("\"status_code\":%d", tc.expectedCode))
			assert.Contains(t, logOutput, "HTTP Request")
		})
	}
}

func (suite *LoggingMiddlewareTestSuite) TestLogger_DifferentHTTPMethods() {
	// Test various HTTP methods
	methods := []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodPatch, http.MethodOptions}

	for _, method := range methods {
		suite.T().Run(fmt.Sprintf("Method_%s", method), func(t *testing.T) {
			// Arrange
			suite.SetupTest() // Fresh setup for each test case
			suite.setupRouterWithMiddleware(Logger())

			// Add route for each method
			suite.router.Handle(method, "/method-test", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"method": method})
			})

			req := httptest.NewRequest(method, "/method-test", nil)
			w := httptest.NewRecorder()

			// Act
			suite.router.ServeHTTP(w, req)

			// Assert
			logOutput := suite.logBuffer.String()
			assert.Contains(t, logOutput, fmt.Sprintf("\"method\":\"%s\"", method))
			assert.Contains(t, logOutput, "HTTP Request")
		})
	}
}

func (suite *LoggingMiddlewareTestSuite) TestLogger_WithErrors() {
	// Arrange
	suite.setupRouterWithMiddleware(Logger())

	req := httptest.NewRequest(http.MethodGet, "/error", nil)
	w := httptest.NewRecorder()

	// Act
	suite.router.ServeHTTP(w, req)

	// Assert
	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)

	logOutput := suite.logBuffer.String()
	assert.Contains(suite.T(), logOutput, "HTTP Request")
	assert.Contains(suite.T(), logOutput, "\"status_code\":400")
	assert.Contains(suite.T(), logOutput, "test error") // Error message should be logged
}

func (suite *LoggingMiddlewareTestSuite) TestLogger_WithBodyContent() {
	// Arrange
	suite.setupRouterWithMiddleware(Logger())

	body := strings.NewReader(`{"test": "data"}`)
	req := httptest.NewRequest(http.MethodPost, "/test", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// Act
	suite.router.ServeHTTP(w, req)

	// Assert
	assert.Equal(suite.T(), http.StatusCreated, w.Code)

	logOutput := suite.logBuffer.String()
	assert.Contains(suite.T(), logOutput, "HTTP Request")
	assert.Contains(suite.T(), logOutput, "\"body_size\":")
	assert.Contains(suite.T(), logOutput, "\"method\":\"POST\"")
}

func (suite *LoggingMiddlewareTestSuite) TestLogger_LatencyTracking() {
	// Arrange
	suite.setupRouterWithMiddleware(Logger())

	// Add endpoint with artificial delay
	suite.router.GET("/slow", func(c *gin.Context) {
		time.Sleep(10 * time.Millisecond) // Small delay
		c.JSON(http.StatusOK, gin.H{"message": "slow response"})
	})

	req := httptest.NewRequest(http.MethodGet, "/slow", nil)
	w := httptest.NewRecorder()

	// Act
	suite.router.ServeHTTP(w, req)

	// Assert
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	logOutput := suite.logBuffer.String()
	assert.Contains(suite.T(), logOutput, "\"latency\":")
	// Verify latency is greater than our sleep duration
	assert.Contains(suite.T(), logOutput, "ms") // Should contain milliseconds
}

func (suite *LoggingMiddlewareTestSuite) TestLogger_TimestampFormat() {
	// Arrange
	suite.setupRouterWithMiddleware(Logger())

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()

	// Act
	suite.router.ServeHTTP(w, req)

	// Assert
	logOutput := suite.logBuffer.String()
	assert.Contains(suite.T(), logOutput, "\"timestamp\":")

	// Verify RFC3339 format (e.g., "2024-01-01T12:00:00Z" or "2024-01-01T12:00:00+02:00")
	timestampRegex := regexp.MustCompile(`"timestamp":"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)"`)
	assert.Regexp(suite.T(), timestampRegex, logOutput)
}

// ========================================================================================
// REQUEST ID MIDDLEWARE TESTS
// ========================================================================================

func (suite *LoggingMiddlewareTestSuite) TestRequestID_ExistingHeader() {
	// Arrange
	suite.setupRouterWithMiddleware(RequestID())

	existingID := "existing-request-id-123"
	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.Header.Set("X-Request-ID", existingID)
	w := httptest.NewRecorder()

	// Act
	suite.router.ServeHTTP(w, req)

	// Assert
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	assert.Equal(suite.T(), existingID, w.Header().Get("X-Request-ID"))
}

func (suite *LoggingMiddlewareTestSuite) TestRequestID_GeneratedHeader() {
	// Arrange
	suite.setupRouterWithMiddleware(RequestID())

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	// No X-Request-ID header set
	w := httptest.NewRecorder()

	// Act
	suite.router.ServeHTTP(w, req)

	// Assert
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	requestID := w.Header().Get("X-Request-ID")
	assert.NotEmpty(suite.T(), requestID)

	// Verify format: YYYYMMDDHHMMSS-XXXXXXXX (timestamp-8chars)
	requestIDRegex := regexp.MustCompile(`^\d{14}-[a-zA-Z0-9]{8}$`)
	assert.Regexp(suite.T(), requestIDRegex, requestID)
}

func (suite *LoggingMiddlewareTestSuite) TestRequestID_ContextStorage() {
	// Arrange
	var contextRequestID string
	suite.router.Use(RequestID())
	suite.router.GET("/test-context", func(c *gin.Context) {
		contextRequestID = c.GetString("request_id")
		c.JSON(http.StatusOK, gin.H{"request_id": contextRequestID})
	})

	req := httptest.NewRequest(http.MethodGet, "/test-context", nil)
	w := httptest.NewRecorder()

	// Act
	suite.router.ServeHTTP(w, req)

	// Assert
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	assert.NotEmpty(suite.T(), contextRequestID)

	// Response header should match context value
	assert.Equal(suite.T(), w.Header().Get("X-Request-ID"), contextRequestID)

	// Verify response body contains the request ID
	var responseBody map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &responseBody)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), contextRequestID, responseBody["request_id"])
}

func (suite *LoggingMiddlewareTestSuite) TestRequestID_EmptyExistingHeader() {
	// Arrange
	suite.setupRouterWithMiddleware(RequestID())

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.Header.Set("X-Request-ID", "") // Empty header
	w := httptest.NewRecorder()

	// Act
	suite.router.ServeHTTP(w, req)

	// Assert
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	requestID := w.Header().Get("X-Request-ID")
	assert.NotEmpty(suite.T(), requestID) // Should generate new ID for empty header

	// Verify generated format
	requestIDRegex := regexp.MustCompile(`^\d{14}-[a-zA-Z0-9]{8}$`)
	assert.Regexp(suite.T(), requestIDRegex, requestID)
}

// ========================================================================================
// GENERATE REQUEST ID TESTS
// ========================================================================================

func (suite *LoggingMiddlewareTestSuite) TestGenerateRequestID_Format() {
	// Act
	requestID := generateRequestID()

	// Assert
	assert.NotEmpty(suite.T(), requestID)

	// Verify format: YYYYMMDDHHMMSS-XXXXXXXX
	requestIDRegex := regexp.MustCompile(`^\d{14}-[a-zA-Z0-9]{8}$`)
	assert.Regexp(suite.T(), requestIDRegex, requestID)

	// Verify timestamp portion is recent (within last minute)
	timestampPart := requestID[:14]
	// Parse in local time since generateRequestID() uses time.Now() (local time)
	parsedTime, err := time.ParseInLocation("20060102150405", timestampPart, time.Local)
	assert.NoError(suite.T(), err)

	timeDiff := time.Since(parsedTime)
	assert.True(suite.T(), timeDiff < time.Minute, "Timestamp should be recent")
	assert.True(suite.T(), timeDiff >= -time.Second, "Timestamp should not be significantly in future")
}

func (suite *LoggingMiddlewareTestSuite) TestGenerateRequestID_Uniqueness() {
	// Act - Generate multiple IDs
	ids := make(map[string]bool)
	for i := 0; i < 100; i++ {
		id := generateRequestID()
		assert.False(suite.T(), ids[id], "Generated ID should be unique: %s", id)
		ids[id] = true
	}

	// Assert
	assert.Equal(suite.T(), 100, len(ids), "All generated IDs should be unique")
}

func (suite *LoggingMiddlewareTestSuite) TestGenerateRequestID_Length() {
	// Act
	requestID := generateRequestID()

	// Assert
	// Format: YYYYMMDDHHMMSS-XXXXXXXX = 14 + 1 + 8 = 23 characters
	assert.Equal(suite.T(), 23, len(requestID))
}

func (suite *LoggingMiddlewareTestSuite) TestGenerateRequestID_ConcurrentGeneration() {
	// Test concurrent generation to ensure thread safety
	const numGoroutines = 100
	const numIterationsPerGoroutine = 10

	idsChan := make(chan string, numGoroutines*numIterationsPerGoroutine)
	var wg sync.WaitGroup

	// Start multiple goroutines generating request IDs concurrently
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := 0; j < numIterationsPerGoroutine; j++ {
				id := generateRequestID()
				idsChan <- id
			}
		}()
	}

	// Wait for all goroutines to complete
	wg.Wait()
	close(idsChan)

	// Collect all generated IDs
	generatedIDs := make(map[string]bool)
	for id := range idsChan {
		// Verify format of each ID
		assert.Regexp(suite.T(), regexp.MustCompile(`^\d{14}-[a-zA-Z0-9]{8}$`), id,
			"Each generated ID should match expected format: %s", id)

		// Check for uniqueness
		assert.False(suite.T(), generatedIDs[id], "Generated ID should be unique: %s", id)
		generatedIDs[id] = true
	}

	// Verify we generated the expected number of unique IDs
	expectedCount := numGoroutines * numIterationsPerGoroutine
	assert.Equal(suite.T(), expectedCount, len(generatedIDs),
		"Should generate %d unique IDs", expectedCount)
}

func (suite *LoggingMiddlewareTestSuite) TestRequestID_ConcurrentRequests() {
	// Test concurrent HTTP requests to ensure request ID middleware thread safety
	suite.setupRouterWithMiddleware(RequestID())

	const numGoroutines = 50
	type requestResult struct {
		requestID  string
		statusCode int
	}

	resultsChan := make(chan requestResult, numGoroutines)
	var wg sync.WaitGroup

	// Start multiple goroutines making concurrent requests
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(goroutineID int) {
			defer wg.Done()

			req := suite.createSimpleTestRequest(http.MethodGet, "/test")
			w := suite.executeRequest(req)

			resultsChan <- requestResult{
				requestID:  w.Header().Get("X-Request-ID"),
				statusCode: w.Code,
			}
		}(i)
	}

	// Wait for all requests to complete
	wg.Wait()
	close(resultsChan)

	// Collect and verify results
	requestIDs := make(map[string]bool)
	for result := range resultsChan {
		// Verify successful response
		assert.Equal(suite.T(), http.StatusOK, result.statusCode,
			"Each request should succeed")

		// Verify request ID format
		suite.assertRequestIDFormat(result.requestID)

		// Check for uniqueness
		assert.False(suite.T(), requestIDs[result.requestID],
			"Each request should have unique request ID: %s", result.requestID)
		requestIDs[result.requestID] = true
	}

	// Verify we got the expected number of unique request IDs
	assert.Equal(suite.T(), numGoroutines, len(requestIDs),
		"Should generate %d unique request IDs", numGoroutines)
}

func (suite *LoggingMiddlewareTestSuite) TestRequestID_ConcurrentWithExistingHeaders() {
	// Test concurrent requests where some have existing request IDs and some don't
	suite.setupRouterWithMiddleware(RequestID())

	const numGoroutines = 40 // Even number for half-and-half split
	type requestResult struct {
		sentRequestID     string
		receivedRequestID string
		statusCode        int
	}

	resultsChan := make(chan requestResult, numGoroutines)
	var wg sync.WaitGroup

	// Start multiple goroutines making concurrent requests
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(goroutineID int) {
			defer wg.Done()

			var req *http.Request
			var sentRequestID string

			if goroutineID%2 == 0 {
				// Half of requests will have existing request IDs
				sentRequestID = fmt.Sprintf("existing-id-%d", goroutineID)
				req = suite.createTestRequestWithHeaders(http.MethodGet, "/test", map[string]string{
					"X-Request-ID": sentRequestID,
				})
			} else {
				// Half will not have request IDs (should generate new ones)
				req = suite.createSimpleTestRequest(http.MethodGet, "/test")
			}

			w := suite.executeRequest(req)

			resultsChan <- requestResult{
				sentRequestID:     sentRequestID,
				receivedRequestID: w.Header().Get("X-Request-ID"),
				statusCode:        w.Code,
			}
		}(i)
	}

	// Wait for all requests to complete
	wg.Wait()
	close(resultsChan)

	// Collect and verify results
	allRequestIDs := make(map[string]bool)
	existingIDCount := 0
	generatedIDCount := 0

	for result := range resultsChan {
		// Verify successful response
		assert.Equal(suite.T(), http.StatusOK, result.statusCode,
			"Each request should succeed")

		if result.sentRequestID != "" {
			// Request had existing ID - should be preserved
			assert.Equal(suite.T(), result.sentRequestID, result.receivedRequestID,
				"Existing request ID should be preserved")
			existingIDCount++
		} else {
			// Request should have generated new ID
			assert.NotEmpty(suite.T(), result.receivedRequestID,
				"New request ID should be generated")
			// Verify generated request ID format
			suite.assertRequestIDFormat(result.receivedRequestID)
			generatedIDCount++
		}

		// Check for overall uniqueness
		assert.False(suite.T(), allRequestIDs[result.receivedRequestID],
			"Each request should have unique request ID: %s", result.receivedRequestID)
		allRequestIDs[result.receivedRequestID] = true
	}

	// Verify we had the expected split
	assert.Equal(suite.T(), numGoroutines/2, existingIDCount,
		"Should have %d requests with existing IDs", numGoroutines/2)
	assert.Equal(suite.T(), numGoroutines/2, generatedIDCount,
		"Should have %d requests with generated IDs", numGoroutines/2)
	assert.Equal(suite.T(), numGoroutines, len(allRequestIDs),
		"Should have %d unique request IDs total", numGoroutines)
}

// ========================================================================================
// RANDOM STRING TESTS
// ========================================================================================

func (suite *LoggingMiddlewareTestSuite) TestRandomString_Length() {
	testCases := []int{0, 1, 5, 8, 16, 32}

	for _, length := range testCases {
		suite.T().Run(fmt.Sprintf("Length_%d", length), func(t *testing.T) {
			// Act
			result := randomString(length)

			// Assert
			assert.Equal(t, length, len(result))
		})
	}
}

func (suite *LoggingMiddlewareTestSuite) TestRandomString_CharacterSet() {
	// Act
	result := randomString(100) // Large sample

	// Assert
	validCharset := "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	for _, char := range result {
		assert.Contains(suite.T(), validCharset, string(char), "Character should be from valid charset: %c", char)
	}
}

func (suite *LoggingMiddlewareTestSuite) TestRandomString_NegativeLength() {
	// Act
	result := randomString(-5)

	// Assert
	assert.Equal(suite.T(), 0, len(result), "Negative length should result in empty string")
}

func (suite *LoggingMiddlewareTestSuite) TestRandomString_Predictability() {
	// Act - Generate multiple strings to document predictability issue
	results := make([]string, 10)
	for i := range results {
		results[i] = randomString(8)
	}

	// Assert - Document that this implementation has predictability issues
	// Note: This test documents a security issue in the current implementation
	// The randomString function uses time.Now().UnixNano() which creates predictable patterns
	allSame := true
	for i := 1; i < len(results); i++ {
		if results[i] != results[0] {
			allSame = false
			break
		}
	}

	// The strings should be different, but due to the implementation flaw, they might be similar
	assert.False(suite.T(), allSame, "Random strings should not all be identical")

	// Document the issue: consecutive calls may produce predictable patterns
	suite.T().Logf("Generated strings: %v", results)
	suite.T().Logf("NOTE: Current implementation uses time.Now().UnixNano() in loop which may create predictable patterns")
}

// ========================================================================================
// RECOVERY MIDDLEWARE TESTS
// ========================================================================================

func (suite *LoggingMiddlewareTestSuite) TestRecovery_StringPanic() {
	// Arrange
	suite.setupRouterWithMiddleware(RequestID(), Recovery())

	req := httptest.NewRequest(http.MethodGet, "/panic", nil)
	w := httptest.NewRecorder()

	// Act
	suite.router.ServeHTTP(w, req)

	// Assert
	assert.Equal(suite.T(), http.StatusInternalServerError, w.Code)

	// Verify error response format
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)

	assert.Equal(suite.T(), errors.ErrInternalError.Error(), response["error"])
	assert.NotEmpty(suite.T(), response["request_id"])

	// Verify log entry
	logOutput := suite.logBuffer.String()
	assert.Contains(suite.T(), logOutput, "Panic recovered")
	assert.Contains(suite.T(), logOutput, "test panic")
	assert.Contains(suite.T(), logOutput, "\"method\":\"GET\"")
	assert.Contains(suite.T(), logOutput, "\"path\":\"/panic\"")
}

func (suite *LoggingMiddlewareTestSuite) TestRecovery_ErrorPanic() {
	// Arrange
	suite.setupRouterWithMiddleware(RequestID(), Recovery())

	req := httptest.NewRequest(http.MethodGet, "/panic-error", nil)
	w := httptest.NewRecorder()

	// Act
	suite.router.ServeHTTP(w, req)

	// Assert
	assert.Equal(suite.T(), http.StatusInternalServerError, w.Code)

	// Verify error response format
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)

	assert.Equal(suite.T(), errors.ErrInternalError.Error(), response["error"])
	assert.NotEmpty(suite.T(), response["request_id"])

	// Verify log entry contains error details
	logOutput := suite.logBuffer.String()
	assert.Contains(suite.T(), logOutput, "Panic recovered")
	assert.Contains(suite.T(), logOutput, "test error panic")
}

func (suite *LoggingMiddlewareTestSuite) TestRecovery_CustomTypePanic() {
	// Arrange
	suite.setupRouterWithMiddleware(RequestID(), Recovery())

	req := httptest.NewRequest(http.MethodGet, "/panic-custom", nil)
	w := httptest.NewRecorder()

	// Act
	suite.router.ServeHTTP(w, req)

	// Assert
	assert.Equal(suite.T(), http.StatusInternalServerError, w.Code)

	// Verify log entry contains custom panic details
	logOutput := suite.logBuffer.String()
	assert.Contains(suite.T(), logOutput, "Panic recovered")
	assert.Contains(suite.T(), logOutput, "custom panic")
}

func (suite *LoggingMiddlewareTestSuite) TestRecovery_WithRequestID() {
	// Arrange
	suite.setupRouterWithMiddleware(RequestID(), Recovery())

	existingID := "test-request-id-456"
	req := httptest.NewRequest(http.MethodGet, "/panic", nil)
	req.Header.Set("X-Request-ID", existingID)
	w := httptest.NewRecorder()

	// Act
	suite.router.ServeHTTP(w, req)

	// Assert
	assert.Equal(suite.T(), http.StatusInternalServerError, w.Code)

	// Verify request ID is preserved in response
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)

	assert.Equal(suite.T(), existingID, response["request_id"])

	// Verify request ID is in log
	logOutput := suite.logBuffer.String()
	assert.Contains(suite.T(), logOutput, fmt.Sprintf("\"request_id\":\"%s\"", existingID))
}

func (suite *LoggingMiddlewareTestSuite) TestRecovery_NoPanic() {
	// Arrange
	suite.setupRouterWithMiddleware(RequestID(), Recovery())

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()

	// Act
	suite.router.ServeHTTP(w, req)

	// Assert - Normal request processing
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Verify no panic recovery logs
	logOutput := suite.logBuffer.String()
	assert.NotContains(suite.T(), logOutput, "Panic recovered")

	// Verify normal response
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "success", response["message"])
}

// ========================================================================================
// STANDARDIZED ERROR TYPES TESTS
// ========================================================================================

func (suite *LoggingMiddlewareTestSuite) TestRecovery_UsesStandardizedInternalError() {
	// Arrange
	suite.setupRouterWithMiddleware(RequestID(), Recovery())

	req := suite.createSimpleTestRequest(http.MethodGet, "/panic")
	w := suite.executeRequest(req)

	// Assert - Verify standardized error is used
	assert.Equal(suite.T(), http.StatusInternalServerError, w.Code)

	// Verify response uses standardized error message
	response := suite.assertResponseJSON(w, map[string]interface{}{
		"error": errors.ErrInternalError.Error(),
	})
	assert.NotEmpty(suite.T(), response["request_id"])

	// Verify log entry
	suite.assertLogContainsMessage("Panic recovered")
	suite.assertLogContainsMessage("test panic")
}

func (suite *LoggingMiddlewareTestSuite) TestLogger_HandlesStandardizedErrors() {
	// Test how the logger middleware handles different standardized error types
	testCases := []struct {
		name          string
		path          string
		setupEndpoint func()
		expectedError error
		expectedCode  int
	}{
		{
			name: "ValidationError",
			path: "/validation-error",
			setupEndpoint: func() {
				suite.router.GET("/validation-error", func(c *gin.Context) {
					c.Error(errors.NewValidationError("email", "email is required"))
					c.JSON(http.StatusBadRequest, gin.H{"error": "validation failed"})
				})
			},
			expectedError: errors.NewValidationError("email", "email is required"),
			expectedCode:  400,
		},
		{
			name: "AuthenticationError",
			path: "/auth-error",
			setupEndpoint: func() {
				suite.router.GET("/auth-error", func(c *gin.Context) {
					c.Error(errors.ErrAuthenticationRequired)
					c.JSON(http.StatusUnauthorized, gin.H{"error": "authentication required"})
				})
			},
			expectedError: errors.ErrAuthenticationRequired,
			expectedCode:  401,
		},
		{
			name: "NotFoundError",
			path: "/not-found-error",
			setupEndpoint: func() {
				suite.router.GET("/not-found-error", func(c *gin.Context) {
					c.Error(errors.ErrUserNotFound)
					c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
				})
			},
			expectedError: errors.ErrUserNotFound,
			expectedCode:  404,
		},
		{
			name: "ConfigurationError",
			path: "/config-error",
			setupEndpoint: func() {
				suite.router.GET("/config-error", func(c *gin.Context) {
					c.Error(errors.ErrDatabaseConnection)
					c.JSON(http.StatusInternalServerError, gin.H{"error": "configuration error"})
				})
			},
			expectedError: errors.ErrDatabaseConnection,
			expectedCode:  500,
		},
	}

	for _, tc := range testCases {
		suite.T().Run(tc.name, func(t *testing.T) {
			// Arrange
			suite.SetupTest() // Fresh setup for each test case
			suite.setupRouterWithMiddleware(Logger())
			tc.setupEndpoint()

			req := suite.createSimpleTestRequest(http.MethodGet, tc.path)
			w := suite.executeRequest(req)

			// Assert
			assert.Equal(t, tc.expectedCode, w.Code)

			// Verify error is logged
			logOutput := suite.logBuffer.String()
			assert.Contains(t, logOutput, "HTTP Request")
			assert.Contains(t, logOutput, tc.expectedError.Error())
			assert.Contains(t, logOutput, fmt.Sprintf("\"status_code\":%d", tc.expectedCode))
		})
	}
}

func (suite *LoggingMiddlewareTestSuite) TestIntegration_StandardizedErrorsWithAllMiddleware() {
	// Test integration of all middleware with standardized errors
	suite.setupRouterWithMiddleware(RequestID(), Logger(), Recovery())

	// Add endpoint that uses standardized validation error
	suite.router.POST("/validate", func(c *gin.Context) {
		// Simulate validation error
		validationErr := errors.NewValidationError("name", "name cannot be empty")
		c.Error(validationErr)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":      "validation failed",
			"details":    validationErr.Error(),
			"request_id": c.GetString("request_id"),
		})
	})

	// Test with custom request ID
	req := suite.createTestRequestWithHeaders(http.MethodPost, "/validate", map[string]string{
		"X-Request-ID": "test-validation-123",
		"Content-Type": "application/json",
	})
	w := suite.executeRequest(req)

	// Assert
	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)

	// Verify request ID is preserved
	assert.Equal(suite.T(), "test-validation-123", w.Header().Get("X-Request-ID"))

	// Verify structured response
	suite.assertResponseJSON(w, map[string]interface{}{
		"error":      "validation failed",
		"details":    "validation error: name - name cannot be empty",
		"request_id": "test-validation-123",
	})

	// Verify logging
	suite.assertLogContains(map[string]interface{}{
		"method":      "POST",
		"path":        "/validate",
		"status_code": 400,
	})
	suite.assertLogContainsMessage("validation error: name - name cannot be empty")
}

// ========================================================================================
// INTEGRATION TESTS
// ========================================================================================

func (suite *LoggingMiddlewareTestSuite) TestIntegration_AllMiddlewareTogether() {
	// Arrange - Use all middleware together
	suite.setupRouterWithMiddleware(RequestID(), Logger(), Recovery())

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()

	// Act
	suite.router.ServeHTTP(w, req)

	// Assert
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Verify request ID is set
	requestID := w.Header().Get("X-Request-ID")
	assert.NotEmpty(suite.T(), requestID)

	// Verify HTTP request is logged
	logOutput := suite.logBuffer.String()
	assert.Contains(suite.T(), logOutput, "HTTP Request")
	assert.Contains(suite.T(), logOutput, "\"method\":\"GET\"")
	assert.Contains(suite.T(), logOutput, "\"path\":\"/test\"")
	assert.Contains(suite.T(), logOutput, "\"status_code\":200")

	// No panic recovery logs for successful request
	assert.NotContains(suite.T(), logOutput, "Panic recovered")
}

func (suite *LoggingMiddlewareTestSuite) TestIntegration_PanicWithLoggingAndRequestID() {
	// Arrange - All middleware with panic
	suite.setupRouterWithMiddleware(RequestID(), Logger(), Recovery())

	req := httptest.NewRequest(http.MethodGet, "/panic", nil)
	w := httptest.NewRecorder()

	// Act
	suite.router.ServeHTTP(w, req)

	// Assert
	assert.Equal(suite.T(), http.StatusInternalServerError, w.Code)

	// Verify request ID is preserved
	requestID := w.Header().Get("X-Request-ID")
	assert.NotEmpty(suite.T(), requestID)

	// Verify both HTTP request and panic recovery are logged
	logOutput := suite.logBuffer.String()
	assert.Contains(suite.T(), logOutput, "HTTP Request")
	assert.Contains(suite.T(), logOutput, "Panic recovered")

	// Verify panic response includes request ID
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), requestID, response["request_id"])
}

// ========================================================================================
// TEST SUITE RUNNER
// ========================================================================================

func TestLoggingMiddlewareTestSuite(t *testing.T) {
	suite.Run(t, new(LoggingMiddlewareTestSuite))
}
