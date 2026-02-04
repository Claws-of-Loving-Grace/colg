import { test, expect } from "@playwright/test";

test.describe("Submit Idea", () => {
  test("shows required field errors", async ({ page }) => {
    await page.goto("/submit");

    await page.getByRole("button", { name: /submit idea/i }).click();

    const requiredErrors = page.locator("span:text-is('Required')");
    await expect(requiredErrors).toHaveCount(4);
    await expect(requiredErrors.first()).toBeVisible();
  });

  test("submits and shows confirmation", async ({ page }) => {
    let receivedPayload: Record<string, string> | null = null;

    await page.route("**/api/ideas", async (route) => {
      const request = route.request();
      receivedPayload = request.postDataJSON() as Record<string, string>;
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          idea: {
            id: "01JTESTULIDEXAMPLE",
            status: "submitted",
            created_at: new Date("2026-02-04T00:00:00.000Z").toISOString(),
            updated_at: new Date("2026-02-04T00:00:00.000Z").toISOString(),
            ...receivedPayload,
          },
        }),
      });
    });

    await page.goto("/submit");

    await page.getByLabel(/idea title/i).fill("Quiet Hours Finder");
    await page.getByLabel(/who it helps/i).fill("Shift workers");
    await page.getByLabel(/^problem/i).fill("Noise and crowds make errands stressful.");
    await page.getByLabel(/mvp scope/i).fill("A list of calm hours for nearby stores.");
    await page.getByLabel(/constraints/i).fill("No paid ads or data resale.");
    await page.getByLabel(/links/i).fill("example.com/quiet-hours");
    await page.getByLabel(/email/i).fill("reader@example.com");

    await page.getByRole("button", { name: /submit idea/i }).click();

    await expect(
      page.getByRole("heading", { name: /your idea has been submitted/i }),
    ).toBeVisible();

    expect(receivedPayload?.title).toBe("Quiet Hours Finder");
    expect(receivedPayload?.submitter_email).toBe("reader@example.com");
  });
});
