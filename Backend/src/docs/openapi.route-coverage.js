import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROUTE_SOURCES = Object.freeze([
  {
    filePath: path.resolve(__dirname, "../routes/health.route.js"),
    prefix: "",
    tag: "Health",
  },
  {
    filePath: path.resolve(__dirname, "../components/auth/auth.routes.js"),
    prefix: "/auth",
    tag: "Auth",
  },
  {
    filePath: path.resolve(__dirname, "../components/users/users.routes.js"),
    prefix: "/users",
    tag: "Users",
  },
  {
    filePath: path.resolve(
      __dirname,
      "../components/subscriptions/subscriptions.routes.js",
    ),
    prefix: "/subscriptions",
    tag: "Subscriptions",
  },
  {
    filePath: path.resolve(
      __dirname,
      "../components/payments/payments.routes.js",
    ),
    prefix: "/payments",
    tag: "Payments",
  },
  {
    filePath: path.resolve(
      __dirname,
      "../components/charities/charities.routes.js",
    ),
    prefix: "/charities",
    tag: "Charities",
  },
  {
    filePath: path.resolve(__dirname, "../components/scores/scores.routes.js"),
    prefix: "/scores",
    tag: "Scores",
  },
  {
    filePath: path.resolve(__dirname, "../components/draws/draws.routes.js"),
    prefix: "/draws",
    tag: "Draws",
  },
  {
    filePath: path.resolve(
      __dirname,
      "../components/winners/winners.routes.js",
    ),
    prefix: "/winners",
    tag: "Winners",
  },
  {
    filePath: path.resolve(
      __dirname,
      "../components/notifications/notifications.routes.js",
    ),
    prefix: "/notifications",
    tag: "Notifications",
  },
  {
    filePath: path.resolve(__dirname, "../components/admin/admin.routes.js"),
    prefix: "/admin",
    tag: "Admin",
  },
  {
    filePath: path.resolve(
      __dirname,
      "../components/reports/reports.routes.js",
    ),
    prefix: "/reports",
    tag: "Reports",
  },
]);

const STATIC_ROUTES = Object.freeze([
  {
    method: "get",
    fullPath: "/",
    tag: "Health",
  },
]);

const PUBLIC_ROUTE_SIGNATURES = new Set(
  [
    "GET /health",
    "GET /",
    "POST /auth/register",
    "POST /auth/login",
    "POST /auth/refresh",
    "POST /auth/verify-email",
    "POST /auth/resend-verification",
    "POST /auth/forgot-password",
    "POST /auth/reset-password",
    "GET /subscriptions/plans",
    "GET /subscriptions/config",
    "GET /charities",
    "GET /charities/rules/effective",
    "POST /payments/webhooks/stripe",
  ].map((item) => item.toUpperCase()),
);

const ROUTE_REGEX = /router\.(get|post|patch|put|delete)\(\s*["']([^"']+)["']/g;

const normalizeRoutePath = (prefix, localPath) => {
  const left = prefix === "/" ? "" : String(prefix || "");
  const right = localPath === "/" ? "" : String(localPath || "");
  const combined = `${left}${right}`.replace(/\/{2,}/g, "/");
  const fallback = combined || "/";

  return fallback.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
};

const toPathParameters = (pathTemplate) => {
  const matches = [...pathTemplate.matchAll(/\{([A-Za-z0-9_]+)\}/g)];

  return matches.map((match) => ({
    name: match[1],
    in: "path",
    required: true,
    schema: {
      type: "string",
    },
  }));
};

const isPublicRoute = (method, fullPath) => {
  return PUBLIC_ROUTE_SIGNATURES.has(
    `${method.toUpperCase()} ${fullPath}`.toUpperCase(),
  );
};

const buildOperation = ({ method, fullPath, tag }) => {
  const summaryMethod = method.toUpperCase();
  const parameters = toPathParameters(fullPath);

  const operation = {
    tags: [tag],
    summary: `${summaryMethod} ${fullPath}`,
    description:
      "Auto-generated OpenAPI coverage entry. Route is implemented and available in the backend.",
    responses: {
      200: {
        description: "Successful response",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
      },
      default: {
        description: "Error response",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
    },
  };

  if (parameters.length > 0) {
    operation.parameters = parameters;
  }

  if (!isPublicRoute(method, fullPath)) {
    operation.security = [{ BearerAuth: [] }];
  }

  if (["post", "put", "patch"].includes(method)) {
    operation.requestBody = {
      required: false,
      content: {
        "application/json": {
          schema: {
            type: "object",
            additionalProperties: true,
          },
        },
      },
    };
  }

  return operation;
};

const listRoutesFromFile = ({ filePath, prefix, tag }) => {
  const content = fs.readFileSync(filePath, "utf8");
  const routes = [];
  let match;

  while ((match = ROUTE_REGEX.exec(content))) {
    const method = match[1].toLowerCase();
    const localPath = match[2];
    const fullPath = normalizeRoutePath(prefix, localPath);

    routes.push({
      method,
      fullPath,
      tag,
    });
  }

  return routes;
};

export const discoverRouteDefinitions = () => {
  const discovered = [...STATIC_ROUTES];

  for (const source of ROUTE_SOURCES) {
    discovered.push(...listRoutesFromFile(source));
  }

  return discovered;
};

export const generateAutoRoutePathDefinitions = (existingPaths = {}) => {
  const discovered = discoverRouteDefinitions();
  const generatedPaths = {};

  for (const route of discovered) {
    if (!generatedPaths[route.fullPath]) {
      generatedPaths[route.fullPath] = {};
    }

    const alreadyDefined =
      existingPaths?.[route.fullPath]?.[route.method] ||
      generatedPaths[route.fullPath]?.[route.method];

    if (alreadyDefined) {
      continue;
    }

    generatedPaths[route.fullPath][route.method] = buildOperation(route);
  }

  return generatedPaths;
};

export const mergeOpenApiPaths = (existingPaths = {}, generatedPaths = {}) => {
  const merged = {};
  const allPaths = new Set([
    ...Object.keys(existingPaths || {}),
    ...Object.keys(generatedPaths || {}),
  ]);

  for (const pathName of allPaths) {
    merged[pathName] = {
      ...(generatedPaths[pathName] || {}),
      ...(existingPaths[pathName] || {}),
    };
  }

  return merged;
};
