const puppeteer = require('puppeteer')

const GOODREADS_URL = "https://www.goodreads.com/choiceawards/best-books-2020"

const selectors = {
    genreAnchor: '.category.clearFix > a',
    closePopupButton: ".modal__content .modal__close .gr-iconButton",
    bookDiv: '.inlineblock.pollAnswer.resultShown',
    bookTooltip: '.tooltip.book-tooltip.js-tooltip',
    name: '#bookTitle',
    name2: '[data-testid="bookTitle"]',
    author: '.authorName',
}

const getRandomBookByGenre = async (genre) => {
    let attemptCount = 0
    try {
        const browser = await puppeteer.launch({ headless: true })
        const page = await browser.newPage()
        await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36'); // escape from bot catching systems
        await page.goto(GOODREADS_URL)

        let genres = await page.$$eval(selectors.genreAnchor, (anchors) => anchors.map(a => ({ url: a.href, genre: a.innerText })))

        let selectedGenre = genres.find(g => g.genre === genre)

        if (!selectedGenre) throw "error"

        await page.goto(selectedGenre.url)

        try {
            let closePopupButton = await page.$(selectors.closePopupButton)
            if (closePopupButton) {
                // await closePopupButton.evaluate(button => button.click());
                const [response] = await Promise.all([
                    page.waitForNavigation(), // The promise resolves after navigation has finished
                    closePopupButton.click()
                ]);

            }

        } catch (error) {

        }

        let bookDivs = await page.$$(selectors.bookDiv)
        let randomNumber = Math.floor(Math.random() * bookDivs.length);
        await bookDivs[randomNumber].evaluate(button => button.click());
        const [response] = await Promise.all([
            page.waitForNavigation(), // The promise resolves after navigation has finished
            bookDivs[randomNumber].click()
        ]);

        let { name, author } = await page.evaluate((bookTitle, bookTitle2, authorAnchor) => {

            let name = document.querySelector(bookTitle, bookTitle2).innerText
            let author = document.querySelector(authorAnchor).innerText

            return { name, author }
        }, selectors.name, selectors.name2, selectors.author)
        // name = await page.$eval(selectors.name, elem => (elem.innerText))
        // author = await page.$eval(selectors.author, elem => (elem.innerText))

        let searchTerm = `${name} ${author}`
        console.log(searchTerm)
        return searchTerm

    } catch (error) {
        if (attemptCount < 2) {
            await getRandomBookByGenre(genre)
            attemptCount++
        }
        return Promise.reject(error)

    }
}


module.exports = {
    getRandomBookByGenre
}