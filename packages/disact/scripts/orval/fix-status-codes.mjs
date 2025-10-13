/**
 * Transformer to fix invalid status codes in OpenAPI spec
 * Converts patterns like "4XX" to "400" which is a valid TypeScript type
 */
export default (inputOpenApiSpec) => {
  const spec = JSON.parse(JSON.stringify(inputOpenApiSpec));

  // Process all paths and operations
  for (const path in spec.paths) {
    for (const method in spec.paths[path]) {
      const operation = spec.paths[path][method];
      if (!operation.responses) continue;

      // Track specific status codes to exclude them from wildcard responses
      const specificCodes = new Set();
      for (const statusCode in operation.responses) {
        if (/^\d+$/.test(statusCode)) {
          specificCodes.add(Number.parseInt(statusCode, 10));
        }
      }

      // Fix wildcard status codes like "4XX", "5XX"
      for (const statusCode in operation.responses) {
        if (/^[1-5]XX$/.test(statusCode)) {
          const response = operation.responses[statusCode];
          // Remove the wildcard status code
          delete operation.responses[statusCode];

          // Generate a valid status code range excluding specific codes
          const baseCode = Number.parseInt(statusCode.charAt(0), 10);
          const start = baseCode * 100;

          // Create a new status code that TypeScript can understand
          // Instead of "4XX", use "400" as a representative code
          const representativeCode = start.toString();

          // Add x-orval extension to handle the range
          response["x-status-code-pattern"] = statusCode;
          operation.responses[representativeCode] = response;
        }
      }
    }
  }

  return spec;
};
