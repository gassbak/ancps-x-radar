
from playwright.sync_api import sync_playwright

URL = "https://ancps-senegal.vercel.app/annuaire"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    print("Ouverture de l'annuaire ANCPS...")
    page.goto(URL, wait_until="domcontentloaded", timeout=60000)

    selector = 'a.group[href^="/certification/"]'
    page.wait_for_selector(selector, timeout=60000)

    cards = page.locator(selector).evaluate_all("""
        elements => elements.map(card => ({
            titre: card.querySelector('h2')?.innerText.trim(),
            url: card.getAttribute('href')
        }))
    """)

    print("Nombre de certifications :", len(cards))
    print("Premières certifications :")

    for card in cards[:5]:
        print(card)

    if cards:
        detail_url = "https://ancps-senegal.vercel.app" + cards[0]["url"]
        page.goto(detail_url, wait_until="domcontentloaded", timeout=60000)
        page.wait_for_selector("h1", timeout=30000)

        print("\nContenu de la première certification :")
        print(page.locator("body").inner_text()[:2500])

    browser.close()
