import { devices, expect, test } from "@playwright/test";

const {
  userAgent: iPhoneUserAgent,
  viewport: iPhoneViewport,
  deviceScaleFactor: iPhoneDeviceScaleFactor,
  isMobile: iPhoneIsMobile,
  hasTouch: iPhoneHasTouch,
} = devices["iPhone 13"];

function createErrorCollector(page) {
  const pageErrors = [];
  const consoleErrors = [];

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  return {
    assertClean() {
      expect(pageErrors, "page errors").toEqual([]);
      expect(consoleErrors, "console errors").toEqual([]);
    },
  };
}

async function openMobileSection(page, sectionIndex) {
  const details = page.locator(".spiro-mobile-ui__section").nth(sectionIndex);
  await details.evaluate((element) => {
    element.open = true;
    element.scrollIntoView({ block: "center" });
  });
}

async function setMobileCheckbox(page, testId, checked) {
  const input = page.locator(
    `[data-testid="control-${testId}"] input[type="checkbox"]`,
  );
  await input.evaluate((element, nextChecked) => {
    element.scrollIntoView({ block: "center" });
    element.checked = nextChecked;
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }, checked);
}

async function clickMobileAction(page, buttonIndex) {
  const button = page.locator(".spiro-mobile-ui__actions button").nth(buttonIndex);
  await button.evaluate((element) => {
    element.scrollIntoView({ block: "center" });
    element.click();
  });
}

test.describe("desktop ambient app smoke", () => {
test("desktop view renders and focus toggle updates the app state", async ({
  page,
}) => {
    const errors = createErrorCollector(page);

    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/");

    await expect(page.locator("canvas")).toBeVisible();
    await expect(page.locator("body")).toHaveAttribute("data-mobile-ui", "false");
    await expect(page.locator('[data-testid="desktop-gui"]')).toBeVisible();

    const desktopGui = page.locator('[data-testid="desktop-gui"]');
    await desktopGui.locator('input[type="checkbox"]').first().check();
    await expect(page.locator("body")).toHaveAttribute("data-focus-mode", "true");

    errors.assertClean();
  });

  test("PWA assets are reachable from the browser", async ({ page }) => {
    await page.goto("/");

    const manifest = await page.evaluate(async () => {
      const response = await fetch("./manifest.webmanifest");
      return response.json();
    });

    expect(manifest.display).toBe("standalone");
    expect(manifest.display_override).toContain("fullscreen");

    const serviceWorkerSource = await page.evaluate(async () => {
      const response = await fetch("./sw.js");
      return response.text();
    });

    expect(serviceWorkerSource).toContain("REQUIRED_ASSETS");
    expect(serviceWorkerSource).toContain("OPTIONAL_ASSETS");
  });
});

test.describe("mobile control panel smoke", () => {
  test.use({
    userAgent: iPhoneUserAgent,
    viewport: iPhoneViewport,
    deviceScaleFactor: iPhoneDeviceScaleFactor,
    isMobile: iPhoneIsMobile,
    hasTouch: iPhoneHasTouch,
  });

  test("mobile controls open and reflect core state changes", async ({
    page,
  }) => {
    const errors = createErrorCollector(page);

    await page.goto("/");

    await expect(page.locator("body")).toHaveAttribute("data-mobile-ui", "true");
    await expect(page.locator('[data-testid="mobile-ui-toggle"]')).toBeVisible();

    await page.locator('[data-testid="mobile-ui-toggle"]').click();
    await expect(page.locator('[data-testid="mobile-ui"]')).toHaveAttribute(
      "data-open",
      "true",
    );

    await setMobileCheckbox(page, "focusModeEnabled", true);
    await expect(page.locator("body")).toHaveAttribute("data-focus-mode", "true");

    await page
      .locator('[data-testid="control-ambientPreset"] select')
      .selectOption("cosmic");
    await expect(page.locator("body")).toHaveAttribute(
      "data-ambient-preset",
      "cosmic",
    );

    await openMobileSection(page, 4);
    await setMobileCheckbox(page, "bgmEnabled", false);
    await expect(page.locator("body")).toHaveAttribute("data-bgm-enabled", "false");

    await setMobileCheckbox(page, "autoDriftEnabled", true);
    await expect(page.locator("body")).toHaveAttribute(
      "data-auto-drift-enabled",
      "true",
    );

    await openMobileSection(page, 5);
    await clickMobileAction(page, 0);
    await expect(page.locator("canvas")).toBeVisible();

    errors.assertClean();
  });
});
