
/**
 * Main API request module that re-exports functionality from sub-modules
 */

// Re-export the sendTranscriptionRequest function from the new module
export { sendTranscriptionRequest } from './transcriptionRequest';

// Re-export types and utility functions that were previously imported here
export { buildRequestConfig } from './configBuilder';
export { pollOperationStatus } from './operationPoller';
