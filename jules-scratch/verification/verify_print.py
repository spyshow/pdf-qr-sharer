from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch()
    context = browser.new_context()
    page = context.new_page()

    try:
        # Navigate to the app
        page.goto("http://localhost:5173", timeout=60000)

        # Upload a file
        file_path = "backend/uploads/ff503540-5217-4bed-9174-ec1736718e44.pdf"
        page.locator(".ant-upload-select input[type='file']").set_input_files(file_path)

        # Fill in file name and tags
        page.get_by_placeholder("Enter custom file name (optional)").fill("Test File")
        page.locator(".ant-select-selection-search-input").fill("test, pdf, qr")

        # Click the upload button
        page.locator(".ant-btn-primary:has-text('Upload')").click()

        # Wait for the QR code to be visible
        expect(page.locator(".printable-area img[alt='QR Code']")).to_be_visible(timeout=10000)

        # Click the print button
        page.get_by_role("button", name="Print QR Code & PDF Link").click()

        # Take a screenshot of the whole page.
        page.screenshot(path="jules-scratch/verification/verification.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
