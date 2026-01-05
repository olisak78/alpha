/**
 * Project Interface Types
 * 
 * Interface definitions for project entities with comprehensive metadata tracking.
 */

/**
 * Project Interface
 * Represents a project entity with full audit trail and metadata support
 */
export interface Project {
  /** Unique identifier for the project */
  id: string;
  
  /** Internal name/identifier for the project */
  name: string;
  
  /** Display title for the project */
  title: string;
  
  /** Detailed description of the project */
  description: string;
  
   alerts?: {
    repo?: string;
  };

  /** Optional health information */
  health?: {
    endpoint?: string;
  };
}