import { test, expect } from "@playwright/test";

const idea = {
  id: "idea-1",
  title: "Quiet Hours Finder",
  problem: "Noise and crowds make errands stressful.",
  who_it_helps: "Shift workers",
  mvp_scope: "Low",
  success_metric: "Fewer abandoned errands",
  constraints: "No ads,No tracking",
  links: "https://example.com/quiet-hours",
  status: "queued",
  score: null,
  submitter_email: "reader@example.com",
  created_at: "2026-02-01T00:00:00.000Z",
  updated_at: "2026-02-01T00:00:00.000Z",
  vote_count: 4,
};

test.describe("Idea detail", () => {
  test("renders idea details and allows voting", async ({ page }) => {
    await page.route("**/api/ideas/idea-1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ idea }),
      });
    });

    await page.route("**/api/ideas/idea-1/vote", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto("/ideas/idea-1");

    await expect(page.getByRole("heading", { name: idea.title })).toBeVisible();
    await expect(page.getByText(idea.problem)).toBeVisible();
    await expect(page.getByText("Submitted by reader@example.com")).toBeVisible();

    await expect(page.getByText("No ads")).toBeVisible();
    await expect(page.getByText("No tracking")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /example.com\/quiet-hours/i }),
    ).toBeVisible();

    const voteButton = page.getByRole("button", { name: /vote for quiet hours finder/i });
    await expect(voteButton).toBeEnabled();
    await expect(voteButton).toContainText("4");

    await voteButton.click();

    await expect(voteButton).toBeDisabled();
    await expect(voteButton).toContainText("5");
  });
});
