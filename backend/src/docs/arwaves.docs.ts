export const arwavesSwaggerSpec = {
  paths: {
    "/arwaves/schemas/unique": {
      get: {
        summary: "Get all unique schemas",
        tags: ["Arwaves"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "pageSize",
            in: "query",
            description: "Number of results per page (default 50)",
            schema: { type: "integer" },
          },
        ],
        responses: {
          "200": {
            description: "Successful response with unique schemas",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    uniqueSchemas: { type: "array", items: { type: "string" } },
                    count: { type: "integer" },
                  },
                },
              },
            },
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Error" } },
            },
          },
        },
      },
    },

    "/arwaves/schema/{schema}": {
      get: {
        summary: "Get data by schema",
        tags: ["Arwaves"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "schema", in: "path", required: true, schema: { type: "string" }, description: "Schema name" },
          { name: "pageSize", in: "query", schema: { type: "integer" }, description: "Results per page, default 20" },
          { name: "after", in: "query", schema: { type: "string" }, description: "Cursor for pagination" },
        ],
        responses: {
          "200": {
            description: "Data fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    schema: { type: "string" },
                    count: { type: "integer" },
                    nextCursor: { type: "string", nullable: true },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          tags: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: { name: { type: "string" }, value: { type: "string" } },
                            },
                          },
                          data: { type: "object" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Schema parameter is required" },
          "500": {
            description: "Internal server error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },

    "/arwaves/schema/{schema}/user/{userId}/history": {
      get: {
        summary: "Get transaction history for a single user",
        tags: ["Arwaves"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "schema", in: "path", required: true, schema: { type: "string" }, description: "Schema name" },
          { name: "userId", in: "path", required: true, schema: { type: "string" }, description: "User ID" },
          { name: "pageSize", in: "query", schema: { type: "integer" }, description: "Results per page, default 20" },
          { name: "after", in: "query", schema: { type: "string" }, description: "Cursor for pagination" },
        ],
        responses: {
          "200": {
            description: "User transaction history fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    schema: { type: "string" },
                    userId: { type: "string" },
                    nextCursor: { type: "string", nullable: true },
                    history: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          txId: { type: "string" },
                          data: { type: "object" },
                          timestamp: { type: "string", nullable: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "User ID is required" },
          "500": {
            description: "Internal server error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
  },

  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          message: { type: "string" },
          error: { type: "string" },
        },
      },
    },
  },
};
