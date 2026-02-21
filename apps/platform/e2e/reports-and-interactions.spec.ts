import { expect, test, type Locator, type Page } from "@playwright/test";

const BASE_URL = "http://localhost:3001";

async function getFirstDetailPath(page: Page, entity: "forum" | "snippets") {
  const regex = new RegExp(`^/(?:[a-z]{2}/)?${entity}/[0-9a-f-]{36}$`, "i");
  const hrefs = await page.locator(`a[href*="/${entity}/"]`).evaluateAll((nodes) =>
    nodes
      .map((n) => (n as HTMLAnchorElement).getAttribute("href"))
      .filter((href): href is string => typeof href === "string"),
  );
  return hrefs.find((href) => regex.test(href)) ?? null;
}

async function openFirstForumPost(page: Page) {
  await page.goto(`${BASE_URL}/forum`);
  await page.waitForLoadState("networkidle");
  const path = await getFirstDetailPath(page, "forum");
  expect(path, "No forum detail link found").toBeTruthy();
  await page.goto(`${BASE_URL}${path as string}`);
  await page.waitForLoadState("networkidle");
}

async function openFirstSnippet(page: Page) {
  await page.goto(`${BASE_URL}/snippets`);
  await page.waitForLoadState("networkidle");
  const path = await getFirstDetailPath(page, "snippets");
  expect(path, "No snippet detail link found").toBeTruthy();
  await page.goto(`${BASE_URL}${path as string}`);
  await page.waitForLoadState("networkidle");
}

async function submitReport(page: Page, reasonLabel = "Spam", details = "E2E test report") {
  const reportButton = page.getByRole("button", { name: /^report$/i }).first();
  await expect(reportButton).toBeVisible({ timeout: 10000 });
  await reportButton.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("combobox").click();
  await page.getByRole("option", { name: new RegExp(reasonLabel, "i") }).click();
  await dialog.getByPlaceholder(/add context/i).fill(details);
  await dialog.getByRole("button", { name: /submit/i }).click();
  await expect(dialog).toBeHidden({ timeout: 10000 });
}

function getLikeCountButtons(scope: Locator) {
  return scope.locator("button").filter({ hasText: /^\d+$/ });
}

test.describe("Reports and Interactions E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("link", { name: /sign in/i })).toHaveCount(0);
  });

  test("1) Forum post report flow", async ({ page }) => {
    await openFirstForumPost(page);
    await submitReport(page, "Spam", "E2E forum report");
  });

  test("2) Snippet report flow", async ({ page }) => {
    await openFirstSnippet(page);
    await submitReport(page, "Inappropriate", "E2E snippet report");
  });

  test("3) Comment report flow", async ({ page }) => {
    await openFirstForumPost(page);
    const commentReportButtons = page.getByRole("button", { name: /^report$/i });
    const reportCount = await commentReportButtons.count();
    test.skip(reportCount < 2, "No reportable comment button found.");
    await commentReportButtons.nth(1).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("combobox").click();
    await page.getByRole("option", { name: /spam/i }).click();
    await dialog.getByPlaceholder(/add context/i).fill("E2E comment report");
    await dialog.getByRole("button", { name: /submit/i }).click();
    await expect(dialog).toBeHidden({ timeout: 10000 });
  });

  test("4) Liked-by modal from forum post", async ({ page }) => {
    await openFirstForumPost(page);
    const likeCountButtons = getLikeCountButtons(page.locator("main"));
    await expect(likeCountButtons.first()).toBeVisible();
    await likeCountButtons.first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("heading", { name: /liked by/i })).toBeVisible();
  });

  test("5) Liked-by modal from snippet", async ({ page }) => {
    await openFirstSnippet(page);
    const likeCountButtons = getLikeCountButtons(page.locator("main"));
    await expect(likeCountButtons.first()).toBeVisible();
    await likeCountButtons.first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("heading", { name: /liked by/i })).toBeVisible();
  });

  test("6) Comment and reply like interactions", async ({ page }) => {
    await openFirstForumPost(page);
    const replyButtons = page.getByRole("button", { name: /^reply$/i });
    test.skip((await replyButtons.count()) === 0, "No comments available on this post.");

    const commentBlock = replyButtons.first().locator("xpath=ancestor::div[contains(@class,'rounded-lg')]").first();
    const counts = getLikeCountButtons(commentBlock);
    test.skip((await counts.count()) < 2, "Comment reaction controls not found.");
    const modalCountButton = counts.nth(1);
    await expect(modalCountButton).toBeVisible();
    const before = (await modalCountButton.innerText()).trim();

    const likeButton = counts.nth(0);
    await likeButton.click();
    await page.waitForTimeout(700);
    const after = (await modalCountButton.innerText()).trim();
    expect(after).not.toBe(before);

    await modalCountButton.click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
  });

  test("7) Reply flow and nested rendering", async ({ page }) => {
    await openFirstForumPost(page);
    const replyButton = page.getByRole("button", { name: /^reply$/i }).first();
    test.skip((await replyButton.count()) === 0, "No comment available for replying.");

    await replyButton.click();
    const replyTextarea = page.getByPlaceholder(/write a reply/i).first();
    await expect(replyTextarea).toBeVisible();
    const replyText = `e2e reply ${Date.now()}`;
    await replyTextarea.fill(replyText);
    await page.getByRole("button", { name: /post reply/i }).click();
    const createdReplyText = page.locator("p", { hasText: replyText }).first();
    await expect(createdReplyText).toBeVisible({ timeout: 10000 });

    const nested = page
      .locator("p", { hasText: replyText })
      .locator("xpath=ancestor::div[contains(@class,'ml-6') and contains(@class,'border-l')]")
      .first();
    await expect(nested).toBeVisible();
  });

  test("8) Admin moderation page", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/reports`);
    await page.waitForLoadState("networkidle");
    const heading = page.getByRole("heading", { name: /reports moderation/i });
    const unauthorized = page.url().includes("/login") || page.url().includes("/feed") || (await heading.count()) === 0;
    test.skip(unauthorized, "Current user is not admin.");

    await expect(heading).toBeVisible();
    await expect(page.locator("table")).toBeVisible();
    await expect(page.getByRole("button", { name: /delete target/i }).first()).toBeVisible();
  });
});
