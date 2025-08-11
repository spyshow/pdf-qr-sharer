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
        page.locator('input[type="file"]').set_input_files(file_path)

        # Fill in file name and tags
        page.get_by_placeholder("Enter custom file name (optional)").fill("Test File")
        page.locator(".ant-select-selection-search-input").fill("test, pdf, qr")

        # Click the upload button
        page.locator(".ant-btn-primary:has-text('Upload')").click()

        # Wait for the QR code to be visible
        qr_codes = page.get_by_alt_text("QR Code").all()
        visible_qr_code = [qr for qr in qr_codes if qr.is_visible()][0]
        expect(visible_qr_code).to_be_visible()


        # Click the print button
        page.get_by_role("button", name="Print QR Code & PDF Link").click()

        # It's not straightforward to screenshot the browser's print dialog.
        # Instead, we will check if the printable content is present in the DOM.
        # The fix was to make sure the content is there, so this is a good verification.
        expect(page.locator("#actual-printable-content")).to_be_visible_in_viewport(timeout=10000)


        # Take a screenshot of the whole page.
        page.screenshot(path="jules-scratch/verification/verification.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
