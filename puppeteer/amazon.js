const puppeteer = require('puppeteer')

const AMAZON_URL = 'https://www.amazon.com'

const selectors = {
    searchBoxId: '#twotabsearchtextbox',
    productLinksClass2: '[class="a-section a-spacing-none s-padding-right-small s-title-instructions-style"] h2[class="a-size-mini a-spacing-none a-color-base s-line-clamp-2"]',
    recaptcha: "[action='/errors/validateCaptcha']",
    outOfStockDiv: '#outOfStock',
    addToCardButton: '#add-to-cart-button',
    buyingChoiceButton: '#buybox-see-all-buying-choices',
    addToCardButtonOffer1: '#a-autoid-2-offer-1',
    cartButton: '#nav-cart',
    hardCover: '#a-autoid-8-announce'
}
/**
 * @param {*} productName 
 */
const buyProduct = async (productName) => {
    try {

        const browser = await puppeteer.launch({ headless: true })
        const page = await browser.newPage()
        await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36'); // escape from bot catching systems
        await page.goto(AMAZON_URL)

        const product = await getProduct(page, productName)

        await browser.close()

        await addProductToCart(product.url)



    } catch (error) {
        return Promise.reject()
    }
}
/**
 * @param {puppeteer.Page} page 
 * @param {string} productName - product name 
 */
const getProduct = async (page, productName) => {
    let attemptCount = 0
    try {
        // search product
        await page.type(selectors.searchBoxId, productName)

        const [response] = await Promise.all([
            page.waitForNavigation(), // The promise resolves after navigation has finished
            page.keyboard.press("Enter")
        ]);

        let products = await page.$$eval(selectors.productLinksClass2, (h2s) => h2s.map(h2 => ({ url: h2.childNodes[0].href, name: h2.innerText })))

        return await findFirstAvailableProduct(page, products)
    } catch (error) {
        if (attemptCount < 2) {
            await getProduct(page, productName)
            attemptCount++
        }
        return Promise.reject(error)
    }

}
/**
 * @param {puppeteer.Page} page 
 * @param {[]} products - product list containing url and name of the products
 */
const findFirstAvailableProduct = async (page, products) => {
    try {
        for (let product of products) {
            try {
                let isRecaptchaOn = checkRecaptchaDiv()
                if (isRecaptchaOn) {
                    await page.reload()
                }
                await page.goto(product.url, { waitUntil: 'domcontentloaded' })

                let addToCardButton = await page.$(selectors.addToCardButton)
                if (addToCardButton) return product
                else {

                    // select hardcover or paperback page
                    let productUrl = await page.evaluate(async () => {
                        let buttons = await document.querySelectorAll('a[class="a-button-text"]')
                        for (let button of buttons) {
                            if (button.innerText.includes("Hardcover") || button.innerText.includes("Paperback")) {
                                return document.url
                            }
                        }
                    })
                    if (productUrl) {
                        return { ...product, url: productUrl }
                    }
                    // check multiple buying options
                    let buyingChoiceButton = await page.$(selectors.buyingChoiceButton)
                    if (buyingChoiceButton) {
                        return product
                    }
                }


                let outOfStockDiv
                try {
                    outOfStockDiv = await page.$(selectors.outOfStockDiv)
                } catch (error) {
                    console.log('no stock div')
                }
                // if product is in stock, return
                if (!outOfStockDiv) return product
            } catch (error) {
                console.log(error)
            }
        }

    } catch (error) {
        return Promise.reject(error)
    }

}

const addProductToCart = async (url) => {
    try {
        const browser = await puppeteer.launch({ headless: false })
        const page = await browser.newPage()
        await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36'); // escape from bot catching systems
        await page.setViewport({ width: 1920, height: 1080 });

        await page.goto(url)


        // select hardcover or paperback page
        await page.evaluate(async () => {
            let buttons = await document.querySelectorAll('a[class="a-button-text"]')
            for (let button of buttons) {
                if (button.innerText.includes("Hardcover") || button.innerText.includes("Paperback")) {
                    await button.click()
                    return
                }
            }

        })

        await page.waitForSelector(selectors.addToCardButton, { timeout: 3000 });

        let addToCardButton = await page.$(selectors.addToCardButton)
        if (addToCardButton) {
            // await addToCardButton.evaluate(b => b.click());
            const [_] = await Promise.all([
                page.waitForNavigation(), // The promise resolves after navigation has finished
                addToCardButton.click()
            ]);

        }

        else {

            // check multiple buying options
            let buyingChoiceButton = await page.$(selectors.buyingChoiceButton)
            if (buyingChoiceButton) {
                const [response] = await Promise.all([
                    page.waitForNavigation(), // The promise resolves after navigation has finished
                    buyingChoiceButton.click()
                ]);

                let addToCardButtonOffer1 = await page.$(selectors.addToCardButtonOffer1)
                const [_] = await Promise.all([
                    page.waitForNavigation(), // The promise resolves after navigation has finished
                    addToCardButtonOffer1.click()
                ]);
            }
        }
        try {
            let cartButton = await page.$(selectors.cartButton)
            await cartButton.click()
        } catch (error) {

        }
    } catch (error) {
        return Promise.reject(error)
    }
}

/**
 * @param {puppeteer.Page} page 
 */
const checkRecaptchaDiv = async (page) => {
    try {
        let recaptchaDiv = await page.$(selectors.recaptcha)
        return recaptchaDiv ?? false
    } catch (error) {
        return false
    }

}

module.exports = {
    addProductToCart,
    buyProduct
}