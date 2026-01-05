package middleware

import (
	"crypto/rand"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	"developer-portal-backend/internal/errors"
)

// Logger returns a gin.HandlerFunc (middleware) that logs requests using logrus
func Logger() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		// Create structured log entry
		logrus.WithFields(logrus.Fields{
			"status_code": param.StatusCode,
			"latency":     param.Latency,
			"client_ip":   param.ClientIP,
			"method":      param.Method,
			"path":        param.Path,
			"user_agent":  param.Request.UserAgent(),
			"error":       param.ErrorMessage,
			"body_size":   param.BodySize,
			"timestamp":   param.TimeStamp.Format(time.RFC3339),
		}).Info("HTTP Request")

		return ""
	})
}

// RequestID adds a unique request ID to each request
func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = generateRequestID()
		}

		c.Header("X-Request-ID", requestID)
		c.Set("request_id", requestID)
		c.Next()
	}
}

// generateRequestID generates a simple request ID
func generateRequestID() string {
	return time.Now().Format("20060102150405") + "-" + randomString(8)
}

// randomString generates a random string of specified length
func randomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	if length <= 0 {
		return ""
	}

	b := make([]byte, length)
	randomBytes := make([]byte, length)

	// Use crypto/rand for proper randomness
	_, err := rand.Read(randomBytes)
	if err != nil {
		// Fallback to time-based approach only if crypto/rand fails (very unlikely)
		for i := range b {
			b[i] = charset[time.Now().UnixNano()%int64(len(charset))]
		}
	} else {
		// Map random bytes to charset
		for i, randomByte := range randomBytes {
			b[i] = charset[randomByte%byte(len(charset))]
		}
	}

	return string(b)
}

// Recovery returns a middleware that recovers from any panics and writes a 500 if there was one
func Recovery() gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, recovered interface{}) {
		logrus.WithFields(logrus.Fields{
			"error":      recovered,
			"request_id": c.GetString("request_id"),
			"path":       c.Request.URL.Path,
			"method":     c.Request.Method,
		}).Error("Panic recovered")

		c.JSON(500, gin.H{
			"error":      errors.ErrInternalError.Error(),
			"request_id": c.GetString("request_id"),
		})
	})
}
