const { getBook } = require("../controllers/getBook")

    test('it should', async () => {

        try {
            const data = await getBook("Humor")
            console.log(data)
            
        } catch (error) {
            console.log(error)
        }

    })