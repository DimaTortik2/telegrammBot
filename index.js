import fetch from 'node-fetch'
const { Bot, HttpError, GrammyError } = require('grammy')
const { hydrate } = require('@grammyjs/hydrate')
require('dotenv').config()

const fetch = require('node-fetch') // Добавляем fetch в Node.js
const URL = 'https://api.nbrb.by/exrates/rates/'

const bot = new Bot(process.env.BOT_TOKEN) // Берем токен из .env

bot.use(hydrate())

const fetchCurrency = async ids => {
	return await Promise.all(
		ids.map(async id => {
			const response = await fetch(`${URL}${id}`)
			if (!response.ok)
				throw new Error(`Ошибка запроса к API: ${response.status}`)
			return await response.json()
		})
	)
}

bot.catch(err => {
	console.error('Ошибка:', err)
	if (err.error instanceof GrammyError) {
		console.error('Ошибка в запросе к Telegram API:', err.error.description)
	} else if (err.error instanceof HttpError) {
		console.error('Ошибка HTTP:', err.error)
	} else {
		console.error('Неизвестная ошибка:', err.error)
	}
})

bot.command('start', async ctx => {
	try {
		const array = await fetchCurrency([456, 431])

		let text = array
			.map(el => {
				const count = el.Cur_Scale > 1 ? el.Cur_Scale : ''
				const name = el.Cur_Abbreviation
				const price = el.Cur_OfficialRate.toFixed(2)

				return `${count} ${name} = ${price} BYN`
			})
			.join('\n')

		const message = await ctx.reply(`Привет Бро,\n${text}`)
		const messageId = message.message_id // Получаем ID сообщения

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
				await ctx.api.editMessageText(
					ctx.chat.id,
					messageId,
					`Привет Бро,\n${text}\nЯ обновил уже ${counter} раз`
				)
			} catch (error) {
				console.error('Ошибка обновления:', error)
				clearInterval(interval)
			}
		}, 1000)
	} catch (error) {
		console.error('Ошибка при старте:', error)
		await ctx.reply('Произошла ошибка при получении данных.')
	}
})

bot.start()
console.log('Бот запущен!')
