import { test, expect } from "@playwright/test";

test.describe("Landing marquee", () => {
  test("renders live stats from API", async ({ page }) => {
    await page.route("**/api/ideas?stats=1**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ideas: [],
          pagination: { page: 1, limit: 1, total: 0 },
          stats: { ideas: 12, votes: 345, shipped: 7 },
        }),
      });
    });

    await page.goto("/");

    const marquee = page.locator(".marquee__track");
    await expect(marquee).toContainText("12 ideas in motion");
    await expect(marquee).toContainText("345 community votes");
    await expect(marquee).toContainText("7 shipped");
  });
});
