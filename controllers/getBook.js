const { buyProduct } = require('../puppeteer/amazon');
const { getRandomBookByGenre } = require('../puppeteer/books');


const getBook = async (genre) => {
    try {
        let bookName = await getRandomBookByGenre(genre)
        await buyProduct(bookName)

    } catch (error) {
        return Promise.reject()
    }
}
module.exports = { getBook }
