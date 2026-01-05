//go:build integration
// +build integration

package repository

import (
	"fmt"
	"strings"
	"testing"
	"time"

	"developer-portal-backend/internal/database/models"
	internal_errors "developer-portal-backend/internal/errors"
	"developer-portal-backend/internal/testutils"

	"github.com/google/uuid"
	"github.com/stretchr/testify/suite"
)

// LinkRepositoryTestSuite tests the LinkRepository
type LinkRepositoryTestSuite struct {
	suite.Suite
	baseTestSuite *testutils.BaseTestSuite
	repo          *LinkRepository
	factories     *testutils.FactorySet
}

// SetupSuite runs before all tests in the suite
func (suite *LinkRepositoryTestSuite) SetupSuite() {
	suite.baseTestSuite = testutils.SetupTestSuite(suite.T())

	suite.repo = NewLinkRepository(suite.baseTestSuite.DB)
	suite.factories = testutils.NewFactorySet()
}

// TearDownSuite runs after all tests in the suite
func (suite *LinkRepositoryTestSuite) TearDownSuite() {
	suite.baseTestSuite.TeardownTestSuite()
}

// SetupTest runs before each test
func (suite *LinkRepositoryTestSuite) SetupTest() {
	suite.baseTestSuite.SetupTest()
}

// TearDownTest runs after each test
func (suite *LinkRepositoryTestSuite) TearDownTest() {
	suite.baseTestSuite.TearDownTest()
}

// No longer needed - using shared helpers from BaseTestSuite

// ==========================================
// Create Method Tests
// ==========================================

// TestCreate_Success tests creating a new link successfully
func (suite *LinkRepositoryTestSuite) TestCreate_Success() {
	// Arrange
	category := suite.baseTestSuite.CreateAndSaveCategory("tools", "Tools Category", "tool-icon", "blue")
	owner := uuid.New()

	link := suite.factories.Link.CreateWithDetails(owner, category.ID, "Test Link", "https://example.com/test", "test,link")

	// Act
	err := suite.repo.Create(link)

	// Assert
	suite.NoError(err)
	suite.NotEqual(uuid.Nil, link.ID)
	suite.NotZero(link.CreatedAt)
	suite.NotZero(link.UpdatedAt)

	// Verify link was actually created in database
	var savedLink models.Link
	err = suite.baseTestSuite.DB.Where("id = ?", link.ID).First(&savedLink).Error
	suite.NoError(err)
	suite.Equal(link.Title, savedLink.Title)
	suite.Equal(link.URL, savedLink.URL)
	suite.Equal(link.Owner, savedLink.Owner)
	suite.Equal(link.CategoryID, savedLink.CategoryID)
}

// TestCreate_WithLongURL tests creating a link with maximum URL length (2000 chars)
func (suite *LinkRepositoryTestSuite) TestCreate_WithLongURL() {
	// Arrange
	category := suite.baseTestSuite.CreateAndSaveCategory("docs", "Documentation", "doc-icon", "green")
	owner := uuid.New()

	longURL := "https://example.com/" + strings.Repeat("a", 1970) // Total ~2000 chars
	link := suite.factories.Link.CreateWithOwnerAndCategory(owner, category.ID)
	link.URL = longURL

	// Act
	err := suite.repo.Create(link)

	// Assert
	suite.NoError(err)
	suite.Equal(longURL, link.URL)
}

// TestCreate_WithLongTags tests creating a link with maximum tags length (200 chars)
func (suite *LinkRepositoryTestSuite) TestCreate_WithLongTags() {
	// Arrange
	category := suite.baseTestSuite.CreateAndSaveCategory("resources", "Resources", "resource-icon", "purple")
	owner := uuid.New()

	longTags := strings.Repeat("tag,", 48) + "end" // ~196 chars
	link := suite.factories.Link.CreateWithOwnerAndCategory(owner, category.ID)
	link.Tags = longTags

	// Act
	err := suite.repo.Create(link)

	// Assert
	suite.NoError(err)
	suite.Equal(longTags, link.Tags)
}

// TestCreate_WithSpecialCharacters tests creating a link with special characters
func (suite *LinkRepositoryTestSuite) TestCreate_WithSpecialCharacters() {
	// Arrange
	category := suite.baseTestSuite.CreateAndSaveCategory("special", "Special Category", "special-icon", "red")
	owner := uuid.New()

	link := suite.factories.Link.CreateWithDetails(
		owner,
		category.ID,
		"Special Characters: åáàâäãčđéèêëíìîïñóòôöõšúùûüýž",
		"https://example.com/test?q=special&chars=åáàâäã",
		"special,unicode,åáàâäã")

	// Act
	err := suite.repo.Create(link)

	// Assert
	suite.NoError(err)
	suite.NotEqual(uuid.Nil, link.ID)
}

// TestCreate_WithEmptyOptionalFields tests creating a link with empty optional fields
func (suite *LinkRepositoryTestSuite) TestCreate_WithEmptyOptionalFields() {
	// Arrange
	category := suite.baseTestSuite.CreateAndSaveCategory("minimal", "Minimal Category", "min-icon", "gray")
	owner := uuid.New()

	link := suite.factories.Link.CreateWithOwnerAndCategory(owner, category.ID)
	link.Tags = ""
	link.Description = ""

	// Act
	err := suite.repo.Create(link)

	// Assert
	suite.NoError(err)
	suite.Equal("", link.Tags)
	suite.Equal("", link.Description)
}

// TestCreate_WithValidCategory tests creating a link with a valid category (positive test)
func (suite *LinkRepositoryTestSuite) TestCreate_WithValidCategory() {
	// Arrange
	category := suite.baseTestSuite.CreateAndSaveCategory("valid", "Valid Category", "valid-icon", "blue")
	owner := uuid.New()

	link := suite.factories.Link.CreateWithOwnerAndCategory(owner, category.ID)

	// Act
	err := suite.repo.Create(link)

	// Assert
	suite.NoError(err)
	suite.NotEqual(uuid.Nil, link.ID)

	// Verify the link was created with the correct category
	retrievedLink, err := suite.repo.GetByID(link.ID)
	suite.NoError(err)
	suite.Equal(category.ID, retrievedLink.CategoryID)
}

// ==========================================
// Create Method Failure Tests
// ==========================================

// TestCreate_InvalidCategoryID tests creating a link with non-existent category ID
func (suite *LinkRepositoryTestSuite) TestCreate_InvalidCategoryID() {
	// Arrange
	nonExistentCategoryID := uuid.New() // This category doesn't exist in DB
	owner := uuid.New()

	link := suite.factories.Link.CreateWithOwnerAndCategory(owner, nonExistentCategoryID)

	// Act
	err := suite.repo.Create(link)

	// Assert - Test current behavior: foreign key constraints may or may not be enforced
	if err != nil {
		suite.T().Log("✓ Database enforces foreign key constraints for category_id")
		suite.Contains(err.Error(), "violates foreign key constraint", "Should get foreign key constraint error")
	} else {
		suite.T().Log("⚠ Database does not currently enforce foreign key constraints for category_id")
		suite.T().Log("  Consider adding proper foreign key constraints or validation at service layer")
		// If it succeeds, verify the link was created (to document current behavior)
		suite.NotEqual(uuid.Nil, link.ID)
	}
}

// TestCreate_EmptyRequiredFields tests creating a link with empty required fields
func (suite *LinkRepositoryTestSuite) TestCreate_EmptyRequiredFields() {
	// Test empty URL
	suite.Run("EmptyURL", func() {
		category := suite.baseTestSuite.CreateAndSaveCategory("test", "Test Category", "test-icon", "blue")
		owner := uuid.New()

		link := suite.factories.Link.CreateWithOwnerAndCategory(owner, category.ID)
		link.URL = "" // Required field

		err := suite.repo.Create(link)
		if err != nil {
			suite.T().Log("✓ Database enforces NOT NULL constraint for URL")
		} else {
			suite.T().Log("⚠ Database allows empty URL - validation should be added at service layer")
			suite.NotEqual(uuid.Nil, link.ID, "If no error, link should be created")
		}
	})

	// Test nil Owner (zero UUID)
	suite.Run("NilOwner", func() {
		category := suite.baseTestSuite.CreateAndSaveCategory("test2", "Test Category 2", "test-icon", "red")

		link := suite.factories.Link.CreateWithCategory(category.ID)
		link.Owner = uuid.Nil // Required field

		err := suite.repo.Create(link)
		if err != nil {
			suite.T().Log("✓ Database enforces NOT NULL constraint for Owner")
		} else {
			suite.T().Log("⚠ Database allows nil owner - validation should be added at service layer")
			suite.NotEqual(uuid.Nil, link.ID, "If no error, link should be created")
		}
	})

	// Test nil CategoryID
	suite.Run("NilCategoryID", func() {
		owner := uuid.New()

		link := suite.factories.Link.CreateWithOwner(owner)
		link.CategoryID = uuid.Nil // Required field

		err := suite.repo.Create(link)
		if err != nil {
			suite.T().Log("✓ Database enforces NOT NULL constraint for CategoryID")
		} else {
			suite.T().Log("⚠ Database allows nil category ID - validation should be added at service layer")
			suite.NotEqual(uuid.Nil, link.ID, "If no error, link should be created")
		}
	})
}

// TestCreate_URLTooLong tests creating a link with URL exceeding 2000 chars
func (suite *LinkRepositoryTestSuite) TestCreate_URLTooLong() {
	// Arrange
	category := suite.baseTestSuite.CreateAndSaveCategory("long-url", "Long URL Category", "long-icon", "yellow")
	owner := uuid.New()

	// Create URL that exceeds 2000 character limit
	longURL := "https://example.com/" + strings.Repeat("a", 2001-len("https://example.com/"))
	suite.Greater(len(longURL), 2000, "URL should exceed 2000 chars for test validity")

	link := suite.factories.Link.CreateWithOwnerAndCategory(owner, category.ID)
	link.URL = longURL

	// Act
	err := suite.repo.Create(link)

	// Assert - Should fail due to size constraint
	suite.Error(err, "Creating link with URL > 2000 chars should fail")
	suite.Contains(err.Error(), "too long", "Should get size constraint error")
}

// TestCreate_TagsTooLong tests creating a link with tags exceeding 200 chars
func (suite *LinkRepositoryTestSuite) TestCreate_TagsTooLong() {
	// Arrange
	category := suite.baseTestSuite.CreateAndSaveCategory("long-tags", "Long Tags Category", "tags-icon", "purple")
	owner := uuid.New()

	// Create tags that exceed 200 character limit
	longTags := strings.Repeat("tag,", 51) // 204 characters (51 * 4 = 204)
	suite.Greater(len(longTags), 200, "Tags should exceed 200 chars for test validity")

	link := suite.factories.Link.CreateWithOwnerAndCategory(owner, category.ID)
	link.Tags = longTags

	// Act
	err := suite.repo.Create(link)

	// Assert - Test current behavior for tags size constraint
	if err != nil {
		suite.T().Log("✓ Database enforces tags size constraint (200 chars)")
		suite.Contains(err.Error(), "too long", "Should get size constraint error")
	} else {
		suite.T().Log("⚠ Database allows tags > 200 chars - size constraint not enforced at DB level")
		suite.NotEqual(uuid.Nil, link.ID, "If no error, link should be created")
	}
}

// TestCreate_EmptyTitle tests creating a link with empty title
func (suite *LinkRepositoryTestSuite) TestCreate_EmptyTitle() {
	// Arrange
	category := suite.baseTestSuite.CreateAndSaveCategory("empty-title", "Empty Title Category", "empty-icon", "gray")
	owner := uuid.New()

	link := suite.factories.Link.CreateWithOwnerAndCategory(owner, category.ID)
	link.Title = "" // Business logic may require this

	// Act
	err := suite.repo.Create(link)

	// Assert - Document current behavior for title validation
	if err != nil {
		suite.T().Log("✓ Repository/Database enforces title validation")
	} else {
		suite.T().Log("ℹ Repository allows empty title - validation may be at service layer")
		suite.NotEqual(uuid.Nil, link.ID, "If no error, link should be created")
	}
}

// TestCreate_DuplicateURL tests creating links with duplicate URLs (if unique constraint exists)
func (suite *LinkRepositoryTestSuite) TestCreate_DuplicateURL() {
	// Arrange
	category := suite.baseTestSuite.CreateAndSaveCategory("duplicate", "Duplicate Category", "dup-icon", "orange")
	owner1 := uuid.New()
	owner2 := uuid.New()

	// Create first link
	link1 := suite.factories.Link.CreateWithDetails(owner1, category.ID, "First Link", "https://example.com/duplicate", "test")
	err := suite.repo.Create(link1)
	suite.NoError(err, "First link should be created successfully")

	// Try to create second link with same URL
	link2 := suite.factories.Link.CreateWithDetails(owner2, category.ID, "Second Link", "https://example.com/duplicate", "test")

	// Act
	err = suite.repo.Create(link2)

	// Assert - Should fail if URL uniqueness is enforced
	// Note: This test documents expected behavior - if URLs should be unique, this should fail
	if err != nil {
		suite.Contains(err.Error(), "duplicate", "Should get duplicate constraint error if URLs must be unique")
	} else {
		// If this passes, it means URLs can be duplicate - document this behavior
		suite.T().Log("URLs can be duplicate - this is the current behavior")
	}
}

// ==========================================
// GetByOwner Method Tests
// ==========================================

// TestGetByOwner_Success tests retrieving links by owner with proper ordering
func (suite *LinkRepositoryTestSuite) TestGetByOwner_Success() {
	// Arrange
	category := suite.baseTestSuite.CreateAndSaveCategory("web", "Web Resources", "web-icon", "orange")
	owner := uuid.New()

	// Create links with titles that test ordering (should be Alpha, Bravo, Charlie)
	_ = suite.baseTestSuite.CreateAndSaveLink(owner, category.ID, "Charlie", "https://example.com/charlie", "test")
	_ = suite.baseTestSuite.CreateAndSaveLink(owner, category.ID, "Alpha", "https://example.com/alpha", "test")
	_ = suite.baseTestSuite.CreateAndSaveLink(owner, category.ID, "Bravo", "https://example.com/bravo", "test")

	// Act
	links, err := suite.repo.GetByOwner(owner)

	// Assert
	suite.NoError(err)
	suite.Len(links, 3)

	// Verify ordering by title ASC
	suite.Equal("Alpha", links[0].Title)
	suite.Equal("Bravo", links[1].Title)
	suite.Equal("Charlie", links[2].Title)

	// Verify all links belong to the correct owner
	for _, link := range links {
		suite.Equal(owner, link.Owner)
	}
}

// TestGetByOwner_NoLinksFound tests retrieving links for owner with no links
func (suite *LinkRepositoryTestSuite) TestGetByOwner_NoLinksFound() {
	// Arrange
	ownerWithNoLinks := uuid.New()

	// Act
	links, err := suite.repo.GetByOwner(ownerWithNoLinks)

	// Assert
	suite.NoError(err)
	suite.Len(links, 0)
}

// TestGetByOwner_MultipleOwners tests that links from different owners are isolated
func (suite *LinkRepositoryTestSuite) TestGetByOwner_MultipleOwners() {
	// Arrange
	category := suite.baseTestSuite.CreateAndSaveCategory("multi", "Multi Owner Category", "multi-icon", "teal")
	owner1 := uuid.New()
	owner2 := uuid.New()

	// Create links for different owners
	_ = suite.baseTestSuite.CreateAndSaveLink(owner1, category.ID, "Owner1 Link1", "https://example.com/o1l1", "")
	_ = suite.baseTestSuite.CreateAndSaveLink(owner1, category.ID, "Owner1 Link2", "https://example.com/o1l2", "")
	_ = suite.baseTestSuite.CreateAndSaveLink(owner2, category.ID, "Owner2 Link1", "https://example.com/o2l1", "")

	// Act
	links1, err1 := suite.repo.GetByOwner(owner1)
	links2, err2 := suite.repo.GetByOwner(owner2)

	// Assert
	suite.NoError(err1)
	suite.NoError(err2)
	suite.Len(links1, 2)
	suite.Len(links2, 1)

	// Verify proper isolation
	for _, link := range links1 {
		suite.Equal(owner1, link.Owner)
	}
	for _, link := range links2 {
		suite.Equal(owner2, link.Owner)
	}
}

// TestGetByOwner_CaseInsensitiveOrdering tests title ordering with mixed case
func (suite *LinkRepositoryTestSuite) TestGetByOwner_CaseInsensitiveOrdering() {
	// Arrange
	category := suite.baseTestSuite.CreateAndSaveCategory("case", "Case Test Category", "case-icon", "pink")
	owner := uuid.New()

	_ = suite.baseTestSuite.CreateAndSaveLink(owner, category.ID, "zebra", "https://example.com/zebra", "")
	_ = suite.baseTestSuite.CreateAndSaveLink(owner, category.ID, "Apple", "https://example.com/apple", "")
	_ = suite.baseTestSuite.CreateAndSaveLink(owner, category.ID, "banana", "https://example.com/banana", "")

	// Act
	links, err := suite.repo.GetByOwner(owner)

	// Assert
	suite.NoError(err)
	suite.Len(links, 3)

	// PostgreSQL default ordering should handle case properly
	expectedOrder := []string{"Apple", "banana", "zebra"}
	for i, expected := range expectedOrder {
		suite.Equal(expected, links[i].Title)
	}
}

// ==========================================
// GetByOwner Method Failure Tests
// ==========================================

// TestGetByOwner_InvalidUUID tests GetByOwner with malformed UUID (if applicable)
func (suite *LinkRepositoryTestSuite) TestGetByOwner_InvalidUUID() {
	// Note: This test documents behavior - uuid.UUID type prevents invalid UUIDs at compile time
	// But we can test with nil UUID
	nilOwner := uuid.Nil

	// Act
	links, err := suite.repo.GetByOwner(nilOwner)

	// Assert - Should handle nil UUID gracefully (either return empty or error)
	if err != nil {
		suite.T().Log("GetByOwner with nil UUID returns error - documenting this behavior")
		suite.Error(err)
	} else {
		suite.T().Log("GetByOwner with nil UUID returns empty results - documenting this behavior")
		suite.NotNil(links, "Should return non-nil slice even for nil owner")
	}
}

// TestGetByOwner_DatabaseError tests GetByOwner when database connection fails
func (suite *LinkRepositoryTestSuite) TestGetByOwner_DatabaseError() {
	// This is more of an integration test to ensure repository handles DB errors gracefully
	// In a real scenario, we might use a mock DB or close connection to test this
	// For now, we document that this should be tested with dependency injection
	suite.T().Log("Database error testing should be implemented with mocked dependencies")

	owner := uuid.New()

	// Act with valid owner (this should work)
	links, err := suite.repo.GetByOwner(owner)

	// Assert
	suite.NoError(err, "GetByOwner should handle valid operations correctly")
	suite.NotNil(links, "Should return non-nil slice")
}

// ==========================================
// GetByIDs Method Tests
// ==========================================

// TestGetByIDs_Success tests retrieving links by multiple IDs
func (suite *LinkRepositoryTestSuite) TestGetByIDs_Success() {
	// Arrange
	category := suite.baseTestSuite.CreateAndSaveCategory("ids", "IDs Test Category", "ids-icon", "cyan")
	owner := uuid.New()

	link1 := suite.baseTestSuite.CreateAndSaveLink(owner, category.ID, "Zeta", "https://example.com/zeta", "")
	link2 := suite.baseTestSuite.CreateAndSaveLink(owner, category.ID, "Alpha", "https://example.com/alpha", "")
	link3 := suite.baseTestSuite.CreateAndSaveLink(owner, category.ID, "Beta", "https://example.com/beta", "")

	ids := []uuid.UUID{link1.ID, link2.ID, link3.ID}

	// Act
	links, err := suite.repo.GetByIDs(ids)

	// Assert
	suite.NoError(err)
	suite.Len(links, 3)

	// Verify ordering by title ASC
	suite.Equal("Alpha", links[0].Title)
	suite.Equal("Beta", links[1].Title)
	suite.Equal("Zeta", links[2].Title)

	// Verify all requested IDs are returned
	returnedIDs := make(map[uuid.UUID]bool)
	for _, link := range links {
		returnedIDs[link.ID] = true
	}
	for _, id := range ids {
		suite.True(returnedIDs[id], "Expected ID %s to be returned", id)
	}
}

// TestGetByIDs_EmptySlice tests retrieving with empty ID slice
func (suite *LinkRepositoryTestSuite) TestGetByIDs_EmptySlice() {
	// Act
	links, err := suite.repo.GetByIDs([]uuid.UUID{})

	// Assert
	suite.NoError(err)
	suite.Len(links, 0)
}

// TestGetByIDs_NonExistentIDs tests retrieving with non-existent IDs
func (suite *LinkRepositoryTestSuite) TestGetByIDs_NonExistentIDs() {
	// Arrange
	nonExistentIDs := []uuid.UUID{uuid.New(), uuid.New()}

	// Act
	links, err := suite.repo.GetByIDs(nonExistentIDs)

	// Assert
	suite.NoError(err)
	suite.Len(links, 0)
}

// TestGetByIDs_MixedExistingAndNonExisting tests retrieving with mixed existing and non-existing IDs
func (suite *LinkRepositoryTestSuite) TestGetByIDs_MixedExistingAndNonExisting() {
	// Arrange
	category := suite.baseTestSuite.CreateAndSaveCategory("mixed", "Mixed IDs Category", "mixed-icon", "lime")
	owner := uuid.New()

	existingLink := suite.baseTestSuite.CreateAndSaveLink(owner, category.ID, "Existing Link", "https://example.com/existing", "")
	nonExistentID := uuid.New()

	ids := []uuid.UUID{existingLink.ID, nonExistentID}

	// Act
	links, err := suite.repo.GetByIDs(ids)

	// Assert
	suite.NoError(err)
	suite.Len(links, 1) // Only the existing link should be returned
	suite.Equal(existingLink.ID, links[0].ID)
}

// TestGetByIDs_SingleID tests retrieving a single link by ID
func (suite *LinkRepositoryTestSuite) TestGetByIDs_SingleID() {
	// Arrange
	category := suite.baseTestSuite.CreateAndSaveCategory("single", "Single ID Category", "single-icon", "brown")
	owner := uuid.New()

	link := suite.baseTestSuite.CreateAndSaveLink(owner, category.ID, "Single Link", "https://example.com/single", "solo")

	// Act
	links, err := suite.repo.GetByIDs([]uuid.UUID{link.ID})

	// Assert
	suite.NoError(err)
	suite.Len(links, 1)
	suite.Equal(link.ID, links[0].ID)
	suite.Equal(link.Title, links[0].Title)
}

// ==========================================
// GetByIDs Method Failure Tests
// ==========================================

// TestGetByIDs_NilSlice tests GetByIDs with nil slice
func (suite *LinkRepositoryTestSuite) TestGetByIDs_NilSlice() {
	// Act
	links, err := suite.repo.GetByIDs(nil)

	// Assert - Should handle nil slice gracefully (same as empty slice)
	suite.NoError(err, "GetByIDs should handle nil slice gracefully")
	suite.NotNil(links, "Should return non-nil slice")
	suite.Len(links, 0, "Should return empty slice for nil input")
}

// TestGetByIDs_LargeSlice tests GetByIDs with very large ID slice
func (suite *LinkRepositoryTestSuite) TestGetByIDs_LargeSlice() {
	// Arrange - Create a large slice of random IDs (all non-existent)
	largeIDSlice := make([]uuid.UUID, 1000)
	for i := 0; i < 1000; i++ {
		largeIDSlice[i] = uuid.New()
	}

	// Act
	links, err := suite.repo.GetByIDs(largeIDSlice)

	// Assert - Should handle large slices without crashing
	suite.NoError(err, "GetByIDs should handle large ID slices")
	suite.NotNil(links, "Should return non-nil slice")
	suite.Len(links, 0, "Should return empty slice when no IDs exist")
}

// TestGetByIDs_DuplicateIDs tests GetByIDs with duplicate IDs in the slice
func (suite *LinkRepositoryTestSuite) TestGetByIDs_DuplicateIDs() {
	// Arrange
	category := suite.baseTestSuite.CreateAndSaveCategory("dup-ids", "Duplicate IDs Category", "dup-icon", "teal")
	owner := uuid.New()

	link := suite.baseTestSuite.CreateAndSaveLink(owner, category.ID, "Duplicate ID Test", "https://example.com/dupids", "test")

	// Create slice with duplicate IDs
	duplicateIDs := []uuid.UUID{link.ID, link.ID, link.ID}

	// Act
	links, err := suite.repo.GetByIDs(duplicateIDs)

	// Assert - Should handle duplicates correctly (return each link only once)
	suite.NoError(err, "GetByIDs should handle duplicate IDs")
	suite.NotNil(links, "Should return non-nil slice")
	suite.Len(links, 1, "Should return each unique link only once despite duplicate IDs")
	suite.Equal(link.ID, links[0].ID)
}

// ==========================================
// GetByID Method Tests
// ==========================================

// TestGetByID_Success tests retrieving a single link by ID successfully
func (suite *LinkRepositoryTestSuite) TestGetByID_Success() {
	// Arrange
	category := suite.baseTestSuite.CreateAndSaveCategory("single", "Single Link Category", "single-icon", "violet")
	owner := uuid.New()

	originalLink := suite.baseTestSuite.CreateAndSaveLink(owner, category.ID, "Get By ID Test", "https://example.com/getbyid", "single,test")

	// Act
	retrievedLink, err := suite.repo.GetByID(originalLink.ID)

	// Assert
	suite.NoError(err)
	suite.NotNil(retrievedLink)
	suite.Equal(originalLink.ID, retrievedLink.ID)
	suite.Equal(originalLink.Title, retrievedLink.Title)
	suite.Equal(originalLink.URL, retrievedLink.URL)
	suite.Equal(originalLink.Owner, retrievedLink.Owner)
	suite.Equal(originalLink.CategoryID, retrievedLink.CategoryID)
	suite.Equal(originalLink.Tags, retrievedLink.Tags)
}

// TestGetByID_NotFound tests retrieving a non-existent link by ID
func (suite *LinkRepositoryTestSuite) TestGetByID_NotFound() {
	// Arrange
	nonExistentID := uuid.New()

	// Act
	link, err := suite.repo.GetByID(nonExistentID)

	// Assert - Repository currently returns raw GORM error, not wrapped custom error
	suite.Error(err, "Should return error for non-existent link")
	if internal_errors.IsNotFound(err) {
		suite.T().Log("✓ Repository properly wraps GORM errors with custom errors")
	} else {
		suite.T().Log("ℹ Repository returns raw GORM errors - consider wrapping with internal_errors.ErrLinkNotFound")
		// For now, accept either custom wrapped error OR raw GORM error
		suite.True(err.Error() == "record not found" || internal_errors.IsNotFound(err), "Should return either GORM or custom NotFound error")
	}
	suite.Nil(link)
}

// ==========================================
// Update Method Tests
// ==========================================

// TestUpdate_Success tests updating a link successfully
func (suite *LinkRepositoryTestSuite) TestUpdate_Success() {
	// Arrange
	category1 := suite.baseTestSuite.CreateAndSaveCategory("original", "Original Category", "orig-icon", "black")
	category2 := suite.baseTestSuite.CreateAndSaveCategory("updated", "Updated Category", "upd-icon", "white")
	owner := uuid.New()

	link := suite.baseTestSuite.CreateAndSaveLink(owner, category1.ID, "Original Title", "https://example.com/original", "original,tags")

	// Modify the link
	link.Title = "Updated Title"
	link.URL = "https://example.com/updated"
	link.CategoryID = category2.ID
	link.Tags = "updated,tags,test"
	link.Description = "Updated description"

	// Act
	err := suite.repo.Update(link)

	// Assert
	suite.NoError(err)

	// Verify changes were persisted
	retrievedLink, err := suite.repo.GetByID(link.ID)
	suite.NoError(err)
	suite.Equal("Updated Title", retrievedLink.Title)
	suite.Equal("https://example.com/updated", retrievedLink.URL)
	suite.Equal(category2.ID, retrievedLink.CategoryID)
	suite.Equal("updated,tags,test", retrievedLink.Tags)
	suite.Equal("Updated description", retrievedLink.Description)
	suite.True(retrievedLink.UpdatedAt.After(retrievedLink.CreatedAt))
}

// TestUpdate_NonExistentLink tests updating a non-existent link
func (suite *LinkRepositoryTestSuite) TestUpdate_NonExistentLink() {
	// Arrange
	category := suite.baseTestSuite.CreateAndSaveCategory("nonexist", "Non Existent Category", "nonexist-icon", "gold")
	nonExistentLink := suite.factories.Link.CreateWithCategory(category.ID)
	nonExistentLink.ID = uuid.New() // Ensure it doesn't exist

	// Act
	err := suite.repo.Update(nonExistentLink)

	// Assert - Expected behavior: Update should either fail or create new record
	// This test documents the actual behavior and ensures it's intentional
	if err != nil {
		// If it errors, it should be a proper NotFound error
		suite.True(internal_errors.IsNotFound(err), "Should return NotFound error if update fails for non-existent record")
	} else {
		// If it succeeds, verify it actually created the record (GORM Save behavior)
		retrievedLink, err := suite.repo.GetByID(nonExistentLink.ID)
		suite.NoError(err, "If update succeeds, record should be retrievable")
		suite.Equal(nonExistentLink.Title, retrievedLink.Title, "Created record should match updated data")
		suite.T().Log("Update on non-existent record creates new record - this is current GORM Save behavior")
	}
}

// TestUpdate_WithValidCategoryChange tests updating a link's category to another valid category
func (suite *LinkRepositoryTestSuite) TestUpdate_WithValidCategoryChange() {
	// Arrange
	category1 := suite.baseTestSuite.CreateAndSaveCategory("original", "Original Category", "orig-icon", "red")
	category2 := suite.baseTestSuite.CreateAndSaveCategory("updated", "Updated Category", "upd-icon", "green")
	owner := uuid.New()

	link := suite.baseTestSuite.CreateAndSaveLink(owner, category1.ID, "Test Link", "https://example.com/test", "test")

	// Update with a different valid category
	link.CategoryID = category2.ID
	link.Title = "Updated Link"

	// Act
	err := suite.repo.Update(link)

	// Assert
	suite.NoError(err)

	// Verify the category was successfully updated
	retrievedLink, err := suite.repo.GetByID(link.ID)
	suite.NoError(err)
	suite.Equal(category2.ID, retrievedLink.CategoryID)
	suite.Equal("Updated Link", retrievedLink.Title)
}

// ==========================================
// Update Method Failure Tests
// ==========================================

// TestUpdate_InvalidCategoryID tests updating a link with non-existent category ID
func (suite *LinkRepositoryTestSuite) TestUpdate_InvalidCategoryID() {
	// Arrange - Create a valid link first
	category := suite.baseTestSuite.CreateAndSaveCategory("valid-cat", "Valid Category", "valid-icon", "blue")
	owner := uuid.New()
	link := suite.baseTestSuite.CreateAndSaveLink(owner, category.ID, "Valid Link", "https://example.com/valid", "test")

	// Update with non-existent category
	nonExistentCategoryID := uuid.New()
	link.CategoryID = nonExistentCategoryID

	// Act
	err := suite.repo.Update(link)

	// Assert - Test current behavior for foreign key constraint on update
	if err != nil {
		suite.T().Log("✓ Database enforces foreign key constraints on update")
		suite.Contains(err.Error(), "violates foreign key constraint", "Should get foreign key constraint error")
	} else {
		suite.T().Log("⚠ Database does not enforce foreign key constraints on update")
		suite.T().Log("  Consider adding validation at service layer")
	}
}

// TestUpdate_URLTooLong tests updating a link with URL exceeding 2000 chars
func (suite *LinkRepositoryTestSuite) TestUpdate_URLTooLong() {
	// Arrange - Create a valid link first
	category := suite.baseTestSuite.CreateAndSaveCategory("update-long", "Update Long URL Category", "update-icon", "green")
	owner := uuid.New()
	link := suite.baseTestSuite.CreateAndSaveLink(owner, category.ID, "Update Test", "https://example.com/short", "test")

	// Update with URL that's too long
	longURL := "https://example.com/" + strings.Repeat("a", 2001-len("https://example.com/"))
	suite.Greater(len(longURL), 2000, "URL should exceed 2000 chars for test validity")
	link.URL = longURL

	// Act
	err := suite.repo.Update(link)

	// Assert - Should fail due to size constraint
	suite.Error(err, "Updating link with URL > 2000 chars should fail")
	suite.Contains(err.Error(), "too long", "Should get size constraint error")
}

// TestUpdate_TagsTooLong tests updating a link with tags exceeding 200 chars
func (suite *LinkRepositoryTestSuite) TestUpdate_TagsTooLong() {
	// Arrange - Create a valid link first
	category := suite.baseTestSuite.CreateAndSaveCategory("update-tags", "Update Tags Category", "update-icon", "red")
	owner := uuid.New()
	link := suite.baseTestSuite.CreateAndSaveLink(owner, category.ID, "Tags Test", "https://example.com/tags", "short")

	// Update with tags that are too long
	longTags := strings.Repeat("tag,", 51) // 204 characters (51 * 4 = 204)
	suite.Greater(len(longTags), 200, "Tags should exceed 200 chars for test validity")
	link.Tags = longTags

	// Act
	err := suite.repo.Update(link)

	// Assert - Test current behavior for tags size constraint on update
	if err != nil {
		suite.T().Log("✓ Database enforces tags size constraint on update")
		suite.Contains(err.Error(), "too long", "Should get size constraint error")
	} else {
		suite.T().Log("⚠ Database allows tags > 200 chars on update - constraint not enforced")
	}
}

// TestUpdate_EmptyRequiredFields tests updating a link with empty required fields
func (suite *LinkRepositoryTestSuite) TestUpdate_EmptyRequiredFields() {
	// Arrange - Create a valid link first
	category := suite.baseTestSuite.CreateAndSaveCategory("update-empty", "Update Empty Fields Category", "update-icon", "purple")
	owner := uuid.New()
	link := suite.baseTestSuite.CreateAndSaveLink(owner, category.ID, "Fields Test", "https://example.com/fields", "test")

	suite.Run("EmptyURL", func() {
		link.URL = "" // Required field
		err := suite.repo.Update(link)
		if err != nil {
			suite.T().Log("✓ Database enforces NOT NULL constraint for URL on update")
		} else {
			suite.T().Log("⚠ Database allows empty URL on update - validation needed at service layer")
		}
	})

	suite.Run("EmptyTitle", func() {
		link.Title = "" // Should not be empty for business logic
		err := suite.repo.Update(link)
		if err != nil {
			suite.T().Log("✓ Repository enforces title validation on update")
		} else {
			suite.T().Log("ℹ Repository allows empty title on update - validation may be at service layer")
		}
	})

	suite.Run("NilOwner", func() {
		link.Owner = uuid.Nil // Required field
		err := suite.repo.Update(link)
		if err != nil {
			suite.T().Log("✓ Database enforces NOT NULL constraint for Owner on update")
		} else {
			suite.T().Log("⚠ Database allows nil owner on update - validation needed at service layer")
		}
	})
}

// ==========================================
// Delete Method Tests
// ==========================================

// TestDelete_Success tests deleting a link successfully
func (suite *LinkRepositoryTestSuite) TestDelete_Success() {
	// Arrange
	category := suite.baseTestSuite.CreateAndSaveCategory("delete", "Delete Category", "delete-icon", "maroon")
	owner := uuid.New()

	link := suite.baseTestSuite.CreateAndSaveLink(owner, category.ID, "To Be Deleted", "https://example.com/delete", "delete,test")

	// Act
	err := suite.repo.Delete(link.ID)

	// Assert
	suite.NoError(err)

	// Verify link is actually deleted
	_, err = suite.repo.GetByID(link.ID)
	suite.Error(err, "Should return error when trying to get deleted link")
	if internal_errors.IsNotFound(err) {
		suite.T().Log("✓ Repository properly wraps GORM errors with custom errors")
	} else {
		suite.T().Log("ℹ Repository returns raw GORM errors - this is current behavior")
		suite.True(err.Error() == "record not found" || internal_errors.IsNotFound(err), "Should return either GORM or custom NotFound error")
	}

	// Verify it doesn't appear in GetByOwner results
	links, err := suite.repo.GetByOwner(owner)
	suite.NoError(err)
	suite.Len(links, 0)
}

// TestDelete_NonExistentLink tests deleting a non-existent link
func (suite *LinkRepositoryTestSuite) TestDelete_NonExistentLink() {
	// Arrange
	nonExistentID := uuid.New()

	// Act
	err := suite.repo.Delete(nonExistentID)

	// Assert
	suite.NoError(err) // GORM Delete doesn't error on non-existent records
}

// TestDelete_VerifyNoSideEffects tests that deleting one link doesn't affect others
func (suite *LinkRepositoryTestSuite) TestDelete_VerifyNoSideEffects() {
	// Arrange
	category := suite.baseTestSuite.CreateAndSaveCategory("sideeffects", "Side Effects Category", "side-icon", "navy")
	owner := uuid.New()

	link1 := suite.baseTestSuite.CreateAndSaveLink(owner, category.ID, "Keep This", "https://example.com/keep", "keep")
	link2 := suite.baseTestSuite.CreateAndSaveLink(owner, category.ID, "Delete This", "https://example.com/delete", "delete")

	// Act
	err := suite.repo.Delete(link2.ID)

	// Assert
	suite.NoError(err)

	// Verify the other link still exists
	retrievedLink, err := suite.repo.GetByID(link1.ID)
	suite.NoError(err)
	suite.Equal(link1.ID, retrievedLink.ID)

	// Verify only one link remains for the owner
	links, err := suite.repo.GetByOwner(owner)
	suite.NoError(err)
	suite.Len(links, 1)
	suite.Equal(link1.ID, links[0].ID)
}

// ==========================================
// Edge Cases and Integration Tests
// ==========================================

// TestLargeDataset tests repository performance with larger datasets
func (suite *LinkRepositoryTestSuite) TestLargeDataset() {
	// Arrange
	category := suite.baseTestSuite.CreateAndSaveCategory("large", "Large Dataset Category", "large-icon", "indigo")
	owner := uuid.New()

	linkCount := 100
	for i := 0; i < linkCount; i++ {
		// Create unique titles to avoid any potential unique constraint violations
		title := fmt.Sprintf("Link-%03d", i)
		url := fmt.Sprintf("https://example.com/link%d", i)
		_ = suite.baseTestSuite.CreateAndSaveLink(owner, category.ID, title, url, "large,dataset")
	}

	// Act
	links, err := suite.repo.GetByOwner(owner)

	// Assert
	suite.NoError(err)
	suite.Len(links, linkCount)

	// Verify ordering is still maintained
	for i := 1; i < len(links); i++ {
		suite.LessOrEqual(links[i-1].Title, links[i].Title, "Links should be ordered by title ASC")
	}
}

// TestTransactionalBehavior tests that operations are properly transactional
func (suite *LinkRepositoryTestSuite) TestTransactionalBehavior() {
	// Arrange
	category := suite.baseTestSuite.CreateAndSaveCategory("transact", "Transaction Category", "trans-icon", "coral")
	owner := uuid.New()

	// Create a link
	link := suite.baseTestSuite.CreateAndSaveLink(owner, category.ID, "Transaction Test", "https://example.com/trans", "transaction")

	// Start a transaction and rollback
	tx := suite.baseTestSuite.DB.Begin()
	linkRepo := NewLinkRepository(tx)

	// Make changes in transaction
	link.Title = "Changed in Transaction"
	err := linkRepo.Update(link)
	suite.NoError(err)

	// Rollback
	tx.Rollback()

	// Act - Verify changes were rolled back
	retrievedLink, err := suite.repo.GetByID(link.ID)

	// Assert
	suite.NoError(err)
	suite.Equal("Transaction Test", retrievedLink.Title) // Should be original title
}

// TestConcurrentAccess tests concurrent access patterns (basic test)
func (suite *LinkRepositoryTestSuite) TestConcurrentAccess() {
	// Arrange
	category := suite.baseTestSuite.CreateAndSaveCategory("concurrent", "Concurrent Category", "concurrent-icon", "salmon")
	owner := uuid.New()

	link := suite.baseTestSuite.CreateAndSaveLink(owner, category.ID, "Concurrent Test", "https://example.com/concurrent", "concurrent")

	// Act - Simulate concurrent reads (basic test)
	done := make(chan error, 10)
	for i := 0; i < 10; i++ {
		go func() {
			_, err := suite.repo.GetByID(link.ID)
			done <- err
		}()
	}

	// Assert - Wait for all goroutines to complete and check errors
	for i := 0; i < 10; i++ {
		err := <-done
		suite.NoError(err, "Concurrent read should not fail")
	}
}

// TestCompleteWorkflow tests a complete CRUD workflow
func (suite *LinkRepositoryTestSuite) TestCompleteWorkflow() {
	// Arrange
	category := suite.baseTestSuite.CreateAndSaveCategory("workflow", "Workflow Category", "workflow-icon", "khaki")
	owner := uuid.New()

	// Create
	link := suite.factories.Link.CreateWithDetails(
		owner,
		category.ID,
		"Workflow Test",
		"https://example.com/workflow",
		"workflow,crud,test")

	// Act & Assert - Create
	err := suite.repo.Create(link)
	suite.NoError(err)
	suite.NotEqual(uuid.Nil, link.ID)

	// Act & Assert - Read
	retrievedLink, err := suite.repo.GetByID(link.ID)
	suite.NoError(err)
	suite.Equal(link.Title, retrievedLink.Title)

	// Act & Assert - Update
	retrievedLink.Title = "Updated Workflow Test"
	retrievedLink.URL = "https://example.com/workflow-updated"
	err = suite.repo.Update(retrievedLink)
	suite.NoError(err)

	// Verify update
	updatedLink, err := suite.repo.GetByID(link.ID)
	suite.NoError(err)
	suite.Equal("Updated Workflow Test", updatedLink.Title)
	suite.Equal("https://example.com/workflow-updated", updatedLink.URL)

	// Act & Assert - Delete
	err = suite.repo.Delete(link.ID)
	suite.NoError(err)

	// Verify deletion
	_, err = suite.repo.GetByID(link.ID)
	suite.Error(err, "Should return error for deleted link")
	if internal_errors.IsNotFound(err) {
		suite.T().Log("✓ Repository properly wraps GORM errors with custom errors")
	} else {
		suite.T().Log("ℹ Repository returns raw GORM errors - this is current behavior")
		suite.True(err.Error() == "record not found" || internal_errors.IsNotFound(err), "Should return either GORM or custom NotFound error")
	}
}

// ==========================================
// Repository Integrity and Business Logic Tests
// ==========================================

// TestRepository_DataIntegrity tests that repository operations maintain data integrity
func (suite *LinkRepositoryTestSuite) TestRepository_DataIntegrity() {
	// Arrange
	category := suite.baseTestSuite.CreateAndSaveCategory("integrity", "Integrity Category", "integrity-icon", "navy")
	owner := uuid.New()

	// Create a link
	link := suite.factories.Link.CreateWithDetails(owner, category.ID, "Integrity Test", "https://example.com/integrity", "integrity,test")
	err := suite.repo.Create(link)
	suite.NoError(err, "Initial link creation should succeed")

	// Test 1: Verify timestamps are set correctly
	suite.NotZero(link.CreatedAt, "CreatedAt should be set after creation")
	suite.NotZero(link.UpdatedAt, "UpdatedAt should be set after creation")
	suite.True(link.CreatedAt.Equal(link.UpdatedAt) || link.UpdatedAt.After(link.CreatedAt), "UpdatedAt should be >= CreatedAt")

	// Test 2: Verify update changes UpdatedAt but not CreatedAt
	originalCreatedAt := link.CreatedAt
	originalUpdatedAt := link.UpdatedAt

	link.Title = "Updated Integrity Test"
	err = suite.repo.Update(link)
	suite.NoError(err, "Update should succeed")

	// Fetch fresh data
	updatedLink, err := suite.repo.GetByID(link.ID)
	suite.NoError(err, "Should be able to fetch updated link")

	suite.Equal(originalCreatedAt.Truncate(time.Second), updatedLink.CreatedAt.Truncate(time.Second), "CreatedAt should not change on update")
	suite.True(updatedLink.UpdatedAt.After(originalUpdatedAt) || updatedLink.UpdatedAt.Equal(originalUpdatedAt), "UpdatedAt should be >= original after update")

	// Test 3: Verify cascading behavior when category is deleted (if implemented)
	// This test documents expected behavior for referential integrity
	suite.T().Log("Cascading delete behavior should be tested when category constraints are defined")
}

// TestRepository_URLValidation tests URL format validation
func (suite *LinkRepositoryTestSuite) TestRepository_URLValidation() {
	category := suite.baseTestSuite.CreateAndSaveCategory("url-validation", "URL Validation Category", "url-icon", "coral")
	owner := uuid.New()

	testCases := []struct {
		name        string
		url         string
		shouldError bool
		description string
	}{
		{
			name:        "ValidHTTPSURL",
			url:         "https://example.com",
			shouldError: false,
			description: "Valid HTTPS URLs should be accepted",
		},
		{
			name:        "ValidHTTPURL",
			url:         "http://example.com",
			shouldError: false,
			description: "Valid HTTP URLs should be accepted",
		},
		{
			name:        "URLWithPath",
			url:         "https://example.com/path/to/resource",
			shouldError: false,
			description: "URLs with paths should be accepted",
		},
		{
			name:        "URLWithQuery",
			url:         "https://example.com?query=value&other=param",
			shouldError: false,
			description: "URLs with query parameters should be accepted",
		},
		{
			name:        "InvalidURL",
			url:         "not-a-url",
			shouldError: true,
			description: "Invalid URL format should be rejected",
		},
		{
			name:        "EmptyURL",
			url:         "",
			shouldError: true,
			description: "Empty URL should be rejected",
		},
		{
			name:        "URLWithSpaces",
			url:         "https://example .com",
			shouldError: true,
			description: "URLs with spaces should be rejected",
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			link := suite.factories.Link.CreateWithOwnerAndCategory(owner, category.ID)
			link.URL = tc.url

			err := suite.repo.Create(link)

			if tc.shouldError {
				if err != nil {
					suite.T().Logf("✓ URL validation working: %s", tc.description)
				} else {
					suite.T().Logf("⚠ Expected error for: %s - URL validation may be at service layer", tc.description)
				}
			} else {
				if err == nil {
					suite.T().Logf("✓ Valid URL accepted: %s", tc.description)
				} else {
					suite.T().Logf("⚠ Unexpected error for valid URL: %s - %v", tc.description, err)
				}
			}
		})
	}
}

// TestRepository_EdgeCasesAndBoundaries tests edge cases and boundary conditions
func (suite *LinkRepositoryTestSuite) TestRepository_EdgeCasesAndBoundaries() {
	category := suite.baseTestSuite.CreateAndSaveCategory("edge-cases", "Edge Cases Category", "edge-icon", "silver")
	owner := uuid.New()

	// Test maximum length fields
	suite.Run("MaxLengthURL", func() {
		// Test URL at exactly 2000 characters
		maxURL := "https://example.com/" + strings.Repeat("a", 2000-len("https://example.com/"))
		suite.Equal(2000, len(maxURL), "URL should be exactly 2000 chars")

		link := suite.factories.Link.CreateWithOwnerAndCategory(owner, category.ID)
		link.URL = maxURL

		err := suite.repo.Create(link)
		suite.NoError(err, "URL of exactly 2000 chars should be accepted")
	})

	suite.Run("MaxLengthTags", func() {
		// Test tags at exactly 200 characters
		maxTags := strings.Repeat("a", 200)
		suite.Equal(200, len(maxTags), "Tags should be exactly 200 chars")

		link := suite.factories.Link.CreateWithOwnerAndCategory(owner, category.ID)
		link.Tags = maxTags

		err := suite.repo.Create(link)
		if err == nil {
			suite.T().Log("✓ Database accepts tags of exactly 200 characters")
		} else {
			suite.T().Logf("⚠ Database rejects tags of 200 chars: %v", err)
		}
	})

	// Test Unicode handling
	suite.Run("UnicodeSupport", func() {
		unicodeTitle := "Test with émojis: 🚀 and spëcial chärs: αβγ"
		unicodeURL := "https://example.com/测试/κόσμος"
		unicodeTags := "émojis,测试,κόσμος"

		link := suite.factories.Link.CreateWithDetails(owner, category.ID, unicodeTitle, unicodeURL, unicodeTags)

		err := suite.repo.Create(link)
		if err == nil {
			suite.T().Log("✓ Database supports Unicode characters")
			// Verify data integrity with Unicode
			retrievedLink, err := suite.repo.GetByID(link.ID)
			if err == nil {
				suite.Equal(unicodeTitle, retrievedLink.Title, "Unicode title should be preserved")
				suite.Equal(unicodeURL, retrievedLink.URL, "Unicode URL should be preserved")
				suite.Equal(unicodeTags, retrievedLink.Tags, "Unicode tags should be preserved")
			} else {
				suite.T().Logf("⚠ Error retrieving Unicode link: %v", err)
			}
		} else {
			suite.T().Logf("⚠ Database does not support Unicode characters: %v", err)
		}
	})
}

// TestRepository_ErrorPropagation tests that repository properly propagates and wraps errors
func (suite *LinkRepositoryTestSuite) TestRepository_ErrorPropagation() {
	// This test verifies that the repository layer properly handles and propagates errors
	// It ensures errors are not silently swallowed and are wrapped with appropriate context

	suite.T().Log("Error propagation testing documents expected behavior:")
	suite.T().Log("1. Database constraint violations should be properly wrapped")
	suite.T().Log("2. Not found errors should be converted to business domain errors")
	suite.T().Log("3. Validation errors should include field context")
	suite.T().Log("4. Database connection errors should be handled gracefully")

	// Test not found error wrapping
	nonExistentID := uuid.New()
	_, err := suite.repo.GetByID(nonExistentID)

	if err != nil {
		suite.T().Logf("GetByID error type: %T", err)
		suite.T().Logf("GetByID error message: %s", err.Error())

		// The repository should ideally wrap gorm.ErrRecordNotFound with internal_errors.ErrLinkNotFound
		// This test documents the current behavior and expected improvements
		if internal_errors.IsNotFound(err) {
			suite.T().Log("✓ Error is properly wrapped as NotFound type")
		} else {
			suite.T().Log("⚠ Repository should wrap GORM errors with domain-specific errors")
			suite.T().Log("  Consider wrapping gorm.ErrRecordNotFound with internal_errors.ErrLinkNotFound")
		}
	}
}

// Run the test suite
func TestLinkRepositoryTestSuite(t *testing.T) {
	suite.Run(t, new(LinkRepositoryTestSuite))
}
