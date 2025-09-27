export const userApiDoc = {
  paths: {
    "/auth/login": {
      post: {
        tags: ["User"],
        summary: "Login user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "User logged in successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    token: { type: "string" },
                    user: { $ref: "#/components/schemas/User" }
                  }
                }
              }
            }
          },
          "401": { description: "Invalid credentials" },
          "500": { description: "Server error" }
        }
      }
    },

    "/auth/signup": {
      post: {
        tags: ["User"],
        summary: "Signup new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "name", "password"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                  phone: { type: "string" },
                  country: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "User registered successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    user: { $ref: "#/components/schemas/User" }
                  }
                }
              }
            }
          },
          "400": { description: "Email already registered" },
          "500": { description: "Server error" }
        }
      }
    },

    "/auth/login-with-google": {
      post: {
        tags: ["User"],
        summary: "Login or signup user with Google",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "name"],
                properties: {
                  email: { type: "string", format: "email" },
                  name: { type: "string" },
                  profileUrl: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "User logged in with Google successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    token: { type: "string" },
                    user: { $ref: "#/components/schemas/User" }
                  }
                }
              }
            }
          },
          "500": { description: "Server error" }
        }
      }
    },

    "/auth/update/user/{id}": {
      put: {
        tags: ["User"],
        summary: "Update user by ID",
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string" }, description: "User ID" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  phone: { type: "string" },
                  country: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "User updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    user: { $ref: "#/components/schemas/User" }
                  }
                }
              }
            }
          },
          "404": { description: "User not found" },
          "500": { description: "Server error" }
        }
      }
    },

    "/auth/delete/user/{id}": {
      delete: {
        tags: ["User"],
        summary: "Delete user by ID",
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string" }, description: "User ID" }
        ],
        responses: {
          "200": {
            description: "User deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" }
                  }
                }
              }
            }
          },
          "404": { description: "User not found" },
          "500": { description: "Server error" }
        }
      }
    }
  },

  components: {
    schemas: {
      User: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          phone: { type: "string" },
          country: { type: "string" },
          isEmailVerified: { type: "boolean" },
          profileUrl: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      }
    }
  }
};
