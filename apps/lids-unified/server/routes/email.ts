import { Router } from "express";

const router = Router();

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

// Send email via Resend
router.post("/send", async (req, res) => {
  if (!RESEND_API_KEY) {
    return res.status(503).json({
      success: false,
      error: "Email service not configured. Please set RESEND_API_KEY environment variable.",
    });
  }

  const { to, subject, body, from } = req.body;

  // Validate required fields
  if (!to || !subject || !body) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: to, subject, body",
    });
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: from || "Admiral Energy <noreply@admiralenergygroup.com>",
        to: [to],
        subject,
        html: body.replace(/\n/g, "<br>"),
        text: body,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[Email] Resend API error:", response.status, errorData);
      return res.status(response.status).json({
        success: false,
        error: (errorData as any).message || `Email service error (${response.status})`,
      });
    }

    const result = await response.json();
    console.log("[Email] Sent successfully:", (result as any).id);

    res.json({
      success: true,
      messageId: (result as any).id,
    });
  } catch (error) {
    console.error("[Email] Failed to send:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    });
  }
});

export { router as emailRoutes };
