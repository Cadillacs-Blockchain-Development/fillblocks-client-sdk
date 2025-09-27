export const organizationApiDoc = {
  paths: {
    "/organization/create": {
      post: {
        tags: ["Organization"],
        summary: "Create a new organization",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["organizationOwner", "organizationName", "wallet"],
                properties: {
                  organizationOwner: { type: "string", description: "Owner user ID" },
                  organizationName: { type: "string", description: "Name of the organization" },
                  aboutMe: { type: "string", description: "Short description about the organization" },
                  teamSize: { type: "integer", description: "Number of team members" }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Organization created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    organization: { $ref: "#/components/schemas/Organization" }
                  }
                }
              }
            }
          },
          "400": { description: "Owner already has an organization" },
          "500": { description: "Server error" }
        }
      }
    },

    "/organization/{orgId}": {
      get: {
        tags: ["Organization"],
        summary: "Get organization details by ID",
        parameters: [
          { in: "path", name: "orgId", required: true, schema: { type: "string" }, description: "Organization ID" }
        ],
        responses: {
          "200": {
            description: "Organization details fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    organization: { $ref: "#/components/schemas/Organization" }
                  }
                }
              }
            }
          },
          "404": { description: "Organization not found" },
          "500": { description: "Server error" }
        }
      },
      put: {
        tags: ["Organization"],
        summary: "Update an organization by ID",
        parameters: [
          { in: "path", name: "orgId", required: true, schema: { type: "string" }, description: "Organization ID" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  organizationName: { type: "string" },
                  aboutMe: { type: "string" },
                  teamSize: { type: "integer" },
                  status: { type: "string", enum: ["active", "inactive", "suspended"] }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Organization updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    organization: { $ref: "#/components/schemas/Organization" }
                  }
                }
              }
            }
          },
          "404": { description: "Organization not found" },
          "500": { description: "Server error" }
        }
      },
      delete: {
        tags: ["Organization"],
        summary: "Delete an organization by ID",
        parameters: [
          { in: "path", name: "orgId", required: true, schema: { type: "string" }, description: "Organization ID" }
        ],
        responses: {
          "200": {
            description: "Organization deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" }
                  }
                }
              }
            }
          },
          "404": { description: "Organization not found" },
          "500": { description: "Server error" }
        }
      }
    }
  },

  components: {
    schemas: {
      Organization: {
        type: "object",
        properties: {
          _id: { type: "string" },
          organizationOwner: { type: "string" },
          organizationName: { type: "string" },
          aboutMe: { type: "string" },
          teamSize: { type: "integer" },
          schemas: { type: "array", items: { type: "string" } },
          clientId: { type: "string" },
          secretKey: { type: "string" },
          wallet: { type: "string" },
          walletPrivateKey: { type: "string" },
          status: { type: "string", enum: ["active", "inactive", "suspended"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      }
    }
  }
};
