import { test, expect } from "@playwright/test";

const baseIdeas = [
  {
    id: "idea-1",
    title: "Quiet Hours Finder",
    who_it_helps: "Shift workers",
    mvp_scope: "Low",
    status: "queued",
    score: null,
    created_at: "2026-02-01T00:00:00.000Z",
    vote_count: 3,
  },
  {
    id: "idea-2",
    title: "Grocery Whisper",
    who_it_helps: "Caregivers",
    mvp_scope: "Medium",
    status: "building",
    score: 7.2,
    created_at: "2026-01-29T00:00:00.000Z",
    vote_count: 9,
  },
];

test.describe("Leaderboard", () => {
  test("loads ideas and allows voting once", async ({ page }) => {
    await page.route("**/api/ideas?**", async (route) => {
      const url = new URL(route.request().url());
      const status = url.searchParams.get("status");
      const ideas =
        status && status !== "all"
          ? baseIdeas.filter((idea) => idea.status === status)
          : baseIdeas;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ideas,
          pagination: {
            page: Number(url.searchParams.get("page") ?? 1),
            limit: Number(url.searchParams.get("limit") ?? 20),
            total: ideas.length,
          },
        }),
      });
    });

    await page.route("**/api/ideas/*/vote", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto("/leaderboard");

    await expect(page.getByRole("heading", { name: /ideas in motion/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /quiet hours finder/i })).toBeVisible();

    const voteButton = page.getByRole("button", { name: /vote for quiet hours finder/i });
    await expect(voteButton).toBeEnabled();
    await expect(voteButton).toContainText("3");

    await voteButton.click();

    await expect(voteButton).toBeDisabled();
    await expect(voteButton).toContainText("4");
  });

  test("filters by status", async ({ page }) => {
    await page.route("**/api/ideas?**", async (route) => {
      const url = new URL(route.request().url());
      const status = url.searchParams.get("status");
      const ideas =
        status && status !== "all"
          ? baseIdeas.filter((idea) => idea.status === status)
          : baseIdeas;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ideas,
          pagination: {
            page: Number(url.searchParams.get("page") ?? 1),
            limit: Number(url.searchParams.get("limit") ?? 20),
            total: ideas.length,
          },
        }),
      });
    });

    await page.goto("/leaderboard");

    await expect(page.getByRole("link", { name: /quiet hours finder/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /grocery whisper/i })).toBeVisible();

    await page.getByLabel("Status").selectOption("queued");

    await expect(page.getByRole("link", { name: /quiet hours finder/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /grocery whisper/i })).toBeHidden();
  });
});
