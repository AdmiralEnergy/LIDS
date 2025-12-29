import { Router } from "express";

const router = Router();

// Runtime env vars
const TWENTY_API_URL = process.env.TWENTY_CRM_URL || "http://localhost:3001";
const TWENTY_API_KEY = process.env.TWENTY_API_KEY || "";

// GraphQL proxy endpoint
router.post("/graphql", async (req, res) => {
  if (!TWENTY_API_URL || !TWENTY_API_KEY) {
    return res.status(503).json({
      error: "Twenty API not configured",
      connected: false,
    });
  }

  try {
    const response = await fetch(`${TWENTY_API_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TWENTY_API_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      throw new Error(`Twenty API returned ${response.status}`);
    }

    const data = await response.json();

    const hasErrors = data.errors && data.errors.length > 0;
    const hasData = data.data && Object.keys(data.data).length > 0;

    if (hasErrors) {
      console.warn("Twenty GraphQL errors:", data.errors);
    }

    res.json({
      ...data,
      connected: true,
      hasErrors: hasErrors,
      usable: hasData && !hasErrors,
    });
  } catch (error) {
    console.error("Twenty API error:", error);
    res.status(503).json({
      error: error instanceof Error ? error.message : "Connection failed",
      connected: false,
    });
  }
});

// Connection status check
router.get("/status", async (req, res) => {
  if (!TWENTY_API_URL || !TWENTY_API_KEY) {
    return res.json({
      connected: false,
      error: "Twenty API not configured",
      url: TWENTY_API_URL ? "configured" : "missing",
    });
  }

  try {
    const response = await fetch(`${TWENTY_API_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TWENTY_API_KEY}`,
      },
      body: JSON.stringify({
        query: "{ __typename }",
      }),
    });

    if (response.ok) {
      res.json({ connected: true, url: TWENTY_API_URL });
    } else {
      res.json({ connected: false, error: `HTTP ${response.status}` });
    }
  } catch (error) {
    res.json({
      connected: false,
      error: error instanceof Error ? error.message : "Connection failed",
    });
  }
});

// Auth endpoint - validate user against Twenty workspaceMembers
router.post("/auth", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: "Email required" });
  }

  if (!TWENTY_API_URL || !TWENTY_API_KEY) {
    return res.status(503).json({ success: false, error: "Twenty not configured" });
  }

  try {
    const response = await fetch(`${TWENTY_API_URL}/rest/workspaceMembers`, {
      headers: {
        Authorization: `Bearer ${TWENTY_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Twenty API returned ${response.status}`);
    }

    const data = await response.json();
    const members = data.data?.workspaceMembers || [];

    // Find member by email (userEmail field)
    const member = members.find(
      (m: any) => m.userEmail?.toLowerCase() === email.toLowerCase()
    );

    if (member) {
      return res.json({
        success: true,
        user: {
          id: member.id,
          name: member.name?.firstName
            ? `${member.name.firstName} ${member.name.lastName || ""}`.trim()
            : member.userEmail,
          email: member.userEmail,
        },
      });
    }

    return res.status(404).json({
      success: false,
      error: "Not a workspace member. Contact admin for access.",
    });
  } catch (error) {
    console.error("Twenty auth error:", error);
    return res.status(503).json({
      success: false,
      error: error instanceof Error ? error.message : "Auth failed",
    });
  }
});

export { router as twentyRoutes };
