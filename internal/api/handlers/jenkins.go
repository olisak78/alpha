package handlers

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"developer-portal-backend/internal/service"

	"github.com/gin-gonic/gin"
)

// JenkinsHandler handles Jenkins-related HTTP requests
type JenkinsHandler struct {
	service service.JenkinsServiceInterface
}

// NewJenkinsHandler creates a new Jenkins handler
func NewJenkinsHandler(s service.JenkinsServiceInterface) *JenkinsHandler {
	return &JenkinsHandler{service: s}
}

// JenkinsParametersResponse represents the response structure for job parameters
type JenkinsParametersResponse struct {
	ParameterDefinitions []JenkinsParameterDefinition `json:"parameterDefinitions"`
}

// JenkinsParameterDefinition represents a single parameter definition
type JenkinsParameterDefinition struct {
	Class                 string                        `json:"_class" example:"hudson.model.StringParameterDefinition"`
	DefaultParameterValue *JenkinsDefaultParameterValue `json:"defaultParameterValue,omitempty"`
	Description           string                        `json:"description" example:"Branch to deploy"`
	Name                  string                        `json:"name" example:"BRANCH"`
	Type                  string                        `json:"type" example:"StringParameterDefinition"`
	Choices               []string                      `json:"choices,omitempty" example:"dev,staging,production"`
}

// JenkinsDefaultParameterValue represents a default parameter value
type JenkinsDefaultParameterValue struct {
	Class string `json:"_class" example:"hudson.model.StringParameterValue"`
	Value string `json:"value" example:"main"`
}

// JenkinsTriggerResponse represents the response when triggering a job
type JenkinsTriggerResponse struct {
	Status      string `json:"status" example:"queued"`
	Message     string `json:"message" example:"Job successfully queued in Jenkins"`
	QueueURL    string `json:"queueUrl" example:"https://gkecfsmulticis2.jaas-gcp.cloud.sap.corp/queue/item/12345/"`
	QueueItemID string `json:"queueItemId" example:"12345"`
	BaseJobURL  string `json:"baseJobUrl" example:"https://gkecfsmulticis2.jaas-gcp.cloud.sap.corp/job/multi-cis-v3-create"`
	JobName     string `json:"jobName" example:"multi-cis-v3-create"`
	JaasName    string `json:"jaasName" example:"gkecfsmulticis2"`
}

// JenkinsQueueStatusResponse represents the response for queue item status
type JenkinsQueueStatusResponse struct {
	Status       string `json:"status" example:"queued"`
	BuildNumber  *int   `json:"buildNumber" example:"123"`
	BuildURL     string `json:"buildUrl" example:"https://gkecfsmulticis2.jaas-gcp.cloud.sap.corp/job/multi-cis-v3-create/123/"`
	QueuedReason string `json:"queuedReason" example:"Waiting for available executor"`
	WaitTime     int    `json:"waitTime" example:"45"`
}

// JenkinsBuildStatusResponse represents the response for build status
type JenkinsBuildStatusResponse struct {
	Status   string `json:"status" example:"success"`
	Result   string `json:"result" example:"SUCCESS"`
	Building bool   `json:"building" example:"false"`
	Duration int    `json:"duration" example:"120"`
	BuildURL string `json:"buildUrl" example:"https://gkecfsmulticis2.jaas-gcp.cloud.sap.corp/job/multi-cis-v3-create/123/"`
}

// GetJobParameters retrieves the parameters definition for a Jenkins job
// @Summary Get Jenkins job parameters
// @Description Retrieves available parameters for a Jenkins job from the specified JAAS instance. Returns only parameters from hudson.model.ParametersDefinitionProperty.
// @Tags jenkins
// @Produce json
// @Param jaasName path string true "JAAS instance name (e.g., 'cfsmc')"
// @Param jobName path string true "Jenkins job name"
// @Success 200 {object} handlers.JenkinsParametersResponse "Filtered parameter definitions containing parameterDefinitions array with name, type, defaultParameterValue, choices, and description"
// @Failure 400 {object} map[string]string "Missing path parameter"
// @Failure 502 {object} map[string]string "Jenkins request failed"
// @Security BearerAuth
// @Router /self-service/jenkins/{jaasName}/{jobName}/parameters [get]
func (h *JenkinsHandler) GetJobParameters(c *gin.Context) {
	jaasName := c.Param("jaasName")
	if jaasName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing path parameter: jaasName"})
		return
	}

	jobName := c.Param("jobName")
	if jobName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing path parameter: jobName"})
		return
	}

	// Create context with user information from auth claims
	ctx := createContextWithUser(c)

	result, err := h.service.GetJobParameters(ctx, jaasName, jobName)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "jenkins request failed: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// createContextWithUser extracts user information from gin context and adds it to a new context
func createContextWithUser(c *gin.Context) context.Context {
	ctx := c.Request.Context()

	userName := getUserName(c)
	userEmail := getUserEmail(c)
	if userName == "" || userEmail == "" {
		return ctx
	}

	ctx = context.WithValue(ctx, "email", userEmail)
	ctx = context.WithValue(ctx, "username", userName)
	ctx = context.WithValue(ctx, "user", userEmail) // Prefer email as primary identifier
	return ctx
}

// TriggerJob triggers a Jenkins job with optional parameters
// @Summary Trigger Jenkins job
// @Description Triggers a Jenkins job on the specified JAAS instance with optional parameters. Returns queue information for tracking. The job is queued initially, and you can poll the queueUrl to get the actual build URL once the job starts running. Parameters can be strings, booleans, or numbers - all will be converted to strings for Jenkins. If no parameters are provided or body is empty, Jenkins will use the default values defined in the job configuration. You can override specific parameters while letting others use their defaults. The baseJobUrl points to the job definition page, not a specific build.
// @Tags jenkins
// @Accept json
// @Produce json
// @Param jaasName path string true "JAAS instance name (e.g., 'gkecfsmulticis2')"
// @Param jobName path string true "Jenkins job name (e.g., 'multi-cis-v3-create')"
// @Param parameters body map[string]interface{} false "Optional job parameters as key-value pairs. Values can be strings, booleans, or numbers. Omitted parameters will use their default values from the job configuration."
// @Success 200 {object} handlers.JenkinsTriggerResponse "Job successfully queued with tracking information (queueUrl can be polled to get build URL)"
// @Failure 400 {object} map[string]string "Missing path parameter or invalid request body"
// @Failure 502 {object} map[string]string "Jenkins trigger failed - check credentials or Jenkins availability"
// @Security BearerAuth
// @Router /self-service/jenkins/{jaasName}/{jobName}/trigger [post]
func (h *JenkinsHandler) TriggerJob(c *gin.Context) {
	jaasName := c.Param("jaasName")
	if jaasName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing path parameter: jaasName"})
		return
	}

	jobName := c.Param("jobName")
	if jobName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing path parameter: jobName"})
		return
	}

	// Parse optional parameters from request body
	// Accept any value type (string, bool, number) and convert to strings for Jenkins
	var rawParameters map[string]interface{}
	if err := c.ShouldBindJSON(&rawParameters); err != nil {
		// If body is empty or invalid, proceed with no parameters
		rawParameters = make(map[string]interface{})
	}

	// Convert all values to strings (Jenkins expects form-encoded string values)
	parameters := make(map[string]string)
	for key, value := range rawParameters {
		// Convert any type to string representation
		switch v := value.(type) {
		case string:
			parameters[key] = v
		case bool:
			if v {
				parameters[key] = "true"
			} else {
				parameters[key] = "false"
			}
		case float64, float32:
			parameters[key] = fmt.Sprintf("%v", v)
		case int, int32, int64:
			parameters[key] = fmt.Sprintf("%d", v)
		case nil:
			parameters[key] = ""
		default:
			// For any other type, use fmt.Sprintf
			parameters[key] = fmt.Sprintf("%v", v)
		}
	}

	// Create context with user information from auth claims
	ctx := createContextWithUser(c)

	result, err := h.service.TriggerJob(ctx, jaasName, jobName, parameters)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "jenkins trigger failed: " + err.Error()})
		return
	}

	// Convert service result to handler response
	response := JenkinsTriggerResponse{
		Status:      result.Status,
		Message:     result.Message,
		QueueURL:    result.QueueURL,
		QueueItemID: result.QueueItemID,
		BaseJobURL:  result.BaseJobURL,
		JobName:     result.JobName,
		JaasName:    result.JaasName,
	}

	c.JSON(http.StatusOK, response)
}

// GetQueueItemStatus retrieves the status of a queued Jenkins job
// @Summary Get Jenkins queue item status
// @Description Retrieves the current status of a queued Jenkins job. Poll this endpoint to track when the job starts building and obtain the build number and URL.
// @Tags jenkins
// @Produce json
// @Param jaasName path string true "JAAS instance name (e.g., 'gkecfsmulticis2')"
// @Param queueItemId path string true "Queue item ID (obtained from trigger response)"
// @Success 200 {object} handlers.JenkinsQueueStatusResponse "Queue item status with build information once started"
// @Failure 404 {object} map[string]string "Queue item not found"
// @Failure 502 {object} map[string]string "Jenkins API request failed"
// @Router /self-service/jenkins/{jaasName}/queue/{queueItemId}/status [get]
func (h *JenkinsHandler) GetQueueItemStatus(c *gin.Context) {
	jaasName := c.Param("jaasName")
	queueItemID := c.Param("queueItemId")

	// Create context with user information from auth claims
	ctx := createContextWithUser(c)

	result, err := h.service.GetQueueItemStatus(ctx, jaasName, queueItemID)
	if err != nil {
		// Check if it's a not found error
		if strings.Contains(err.Error(), "queue item not found") {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusBadGateway, gin.H{"error": "jenkins queue item status failed: " + err.Error()})
		return
	}

	// Convert service result to handler response
	response := JenkinsQueueStatusResponse{
		Status:       result.Status,
		BuildNumber:  result.BuildNumber,
		BuildURL:     result.BuildURL,
		QueuedReason: result.QueuedReason,
		WaitTime:     result.WaitTime,
	}

	c.JSON(http.StatusOK, response)
}

// GetBuildStatus retrieves the status of a Jenkins build
// @Summary Get Jenkins build status
// @Description Retrieves the current status of a Jenkins build. Poll this endpoint to track the build progress and check if it has completed successfully.
// @Tags jenkins
// @Produce json
// @Param jaasName path string true "JAAS instance name (e.g., 'gkecfsmulticis2')"
// @Param jobName path string true "Jenkins job name"
// @Param buildNumber path int true "Build number (obtained from queue status)"
// @Success 200 {object} handlers.JenkinsBuildStatusResponse "Build status with result and duration"
// @Failure 400 {object} map[string]string "Invalid build number"
// @Failure 404 {object} map[string]string "Build not found"
// @Failure 502 {object} map[string]string "Jenkins API request failed"
// @Router /self-service/jenkins/{jaasName}/{jobName}/{buildNumber}/status [get]
func (h *JenkinsHandler) GetBuildStatus(c *gin.Context) {
	jaasName := c.Param("jaasName")
	jobName := c.Param("jobName")
	buildNumberStr := c.Param("buildNumber")

	// Parse build number
	var actualBuildNumber int
	_, err := fmt.Sscanf(buildNumberStr, "%d", &actualBuildNumber)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid build number"})
		return
	}

	// Create context with user information from auth claims
	ctx := createContextWithUser(c)

	result, err := h.service.GetBuildStatus(ctx, jaasName, jobName, actualBuildNumber)
	if err != nil {
		// Check if it's a not found error
		if strings.Contains(err.Error(), "build not found") {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusBadGateway, gin.H{"error": "jenkins build status failed: " + err.Error()})
		return
	}

	// Convert service result to handler response
	// Convert duration from milliseconds to seconds
	durationSeconds := int(result.Duration / 1000)

	response := JenkinsBuildStatusResponse{
		Status:   result.Status,
		Result:   result.Result,
		Building: result.Building,
		Duration: durationSeconds,
		BuildURL: result.BuildURL,
	}

	c.JSON(http.StatusOK, response)
}

// GetConcourseLatestExecution retrieves the latest execution number from concourse-status-developer-portal job
// @Summary Get Concourse latest execution
// @Description Retrieves the latest successful build number from the concourse-status-developer-portal Jenkins job
// @Tags concourse
// @Produce json
// @Success 200 {object} map[string]int "Latest execution number"
// @Failure 502 {object} map[string]string "Jenkins request failed"
// @Security BearerAuth
// @Router /concourse/latest-execution [get]
func (h *JenkinsHandler) GetConcourseLatestExecution(c *gin.Context) {
	// Create context with user information from auth claims
	ctx := createContextWithUser(c)

	buildNumber, err := h.service.GetConcourseLatestExecution(ctx)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to get latest execution: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"buildNumber": buildNumber})
}

// GetConcourseJobs retrieves the concourse jobs from Jenkins artifact
// @Summary Get Concourse jobs
// @Description Retrieves concourse jobs from the Jenkins artifact. Can filter by landscape parameter.
// @Tags concourse
// @Produce json
// @Param landscape query string false "Filter by landscape (e.g., 'cf-ae01'). Omit or use 'all' for all landscapes"
// @Success 200 {object} map[string]interface{} "Concourse jobs data organized by landscape"
// @Failure 400 {object} map[string]string "Invalid build number"
// @Failure 502 {object} map[string]string "Jenkins request failed"
// @Security BearerAuth
// @Router /concourse/jobs [get]
func (h *JenkinsHandler) GetConcourseJobs(c *gin.Context) {
	landscape := c.DefaultQuery("landscape", "all")

	// Create context with user information from auth claims
	ctx := createContextWithUser(c)

	// First get the latest execution number
	buildNumber, err := h.service.GetConcourseLatestExecution(ctx)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to get latest execution: " + err.Error()})
		return
	}

	// Then fetch the jobs
	result, err := h.service.GetConcourseJobs(ctx, buildNumber, landscape)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to get concourse jobs: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}
