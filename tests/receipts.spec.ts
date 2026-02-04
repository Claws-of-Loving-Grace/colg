import { test, expect } from "@playwright/test";

const receipts = [
  {
    id: "receipt-1",
    idea_id: "idea-1",
    summary: "Shipped a calming shift handoff board.",
    metric: "Weekly active teams",
    shipped_url: "https://shipped.example.com",
    created_at: "2026-02-02T00:00:00.000Z",
    idea_title: "Quiet Hours Finder",
    who_it_helps: "Shift workers",
    mvp_scope: "Low",
    deploy_url: "https://deploy.example.com",
  },
  {
    id: "receipt-2",
    idea_id: "idea-2",
    summary: "Built a caregiver grocery companion.",
    metric: "Daily checklists created",
    shipped_url: null,
    created_at: "2026-01-30T00:00:00.000Z",
    idea_title: "Grocery Whisper",
    who_it_helps: "Caregivers",
    mvp_scope: "Medium",
    deploy_url: null,
  },
];

const receiptDetail = {
  id: "receipt-1",
  idea_id: "idea-1",
  summary: "Shipped a calming shift handoff board.",
  metric: "Weekly active teams",
  next_steps: "Add export tools.",
  shipped_url: "https://shipped.example.com",
  created_at: "2026-02-02T00:00:00.000Z",
  idea_title: "Quiet Hours Finder",
  who_it_helps: "Shift workers",
  mvp_scope: "Low",
  problem: "Shift workers need quiet hours visibility.",
  deploy_url: "https://deploy.example.com",
};

test.describe("Receipts", () => {
  test("lists receipts", async ({ page }) => {
    await page.route("**/api/receipts?**", async (route) => {
      const url = new URL(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          receipts,
          pagination: {
            page: Number(url.searchParams.get("page") ?? 1),
            limit: Number(url.searchParams.get("limit") ?? 12),
            total: receipts.length,
          },
        }),
      });
    });

    await page.goto("/receipts");

    await expect(page.getByRole("heading", { name: /shipped work/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /quiet hours finder/i })).toBeVisible();
    await expect(page.getByText(/metric: weekly active teams/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /deployed url/i })).toBeVisible();
  });

  test("shows receipt detail", async ({ page }) => {
    await page.route("**/api/receipts/receipt-1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ receipt: receiptDetail }),
      });
    });

    await page.goto("/receipts/receipt-1");

    await expect(page.getByRole("heading", { name: /quiet hours finder/i })).toBeVisible();
    await expect(page.getByText("Receipt", { exact: true })).toBeVisible();
    await expect(page.getByText(/add export tools/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /deployed url/i })).toBeVisible();
  });
});
