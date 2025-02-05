const req = require('express/lib/request')
const res = require('express/lib/response')
const { Bot, HttpError, GrammyError } = require('grammy')
const { hydrate } = require('@grammyjs/hydrate')
require('dotenv').config()

const URL = 'https://api.nbrb.by/exrates/rates/'

const bot = new Bot('6863938681:AAFOuWVBsc_SCHMhxUN-HRlihXUK1XeAzoQ')
bot.use(hydrate())

const fetchCurrency = async ids => {
	return await Promise.all(
		ids.map(async id => {
			const response = await fetch(`${URL}${id}`)
			return await response.json()
		})
	)
}

bot.catch(err => {
	const ctx = err.ctx
	console.error(`Ошибка при обработке обновления ${ctx.update.update_id}:`)
	const e = err.error
	if (e instanceof GrammyError) {
		console.error('Ошибка в запросе:', e.description)
	} else if (e instanceof HttpError) {
		console.error('Не удалось связаться с Telegram:', e)
	} else {
		console.error('Неизвестная ошибка:', e)
	}
})

bot.command('start', async ctx => {
	const array = await fetchCurrency([456, 431])

	text = array
		.map(el => {
			const count = el.Cur_Scale > 1 ? el.Cur_Scale : ''
			const name = el.Cur_Abbreviation
			const price = el.Cur_OfficialRate.toFixed(2)

			return `${count} ${name} = ${price} BYN`
		})
		.join('\n')

	const message = await ctx.reply(`Привет Бро,\n${text}`)

	let counter = 0

	const interval = setInterval(async () => {
		try {
			const array = await fetchCurrency([456, 431])

			text = array
				.map(el => {
					const count = el.Cur_Scale > 1 ? el.Cur_Scale : ''
					const name = el.Cur_Abbreviation
					const price = el.Cur_OfficialRate.toFixed(2)

					return `${count} ${name} = ${price} BYN`
				})
				.join('\n')
			counter++
			await message.editText(`Привет Бро,\n${text}\nЯ обновил уже ${counter} раз`)
		} catch (error) {
			await message.editText(`Ошибка: ${error}`)
			clearInterval(interval)
		}
	}, 1000)
})

bot.start()




console.log(process.env.MESSAGE)