const TelegramApi = require("node-telegram-bot-api")
require("dotenv").config()
const token = process.env.TELEGRAM_TOKEN

const bot = new TelegramApi(token, {polling: true})
const sequelize = require("./db")

const UserModel = require("./models")

const cheerio = require("cheerio")

const express = require("express")
const cors = require("cors")
const app = express()
app.use(express.json())
app.use(cors())
app.get("/groups", async (req, res) => {
    const {course} = req.query
    const baseLink = `https://kipt.sumdu.edu.ua/uk/rozklad-zaniat/${72 + Number(course)}-${course}-kurs?start=`
    const groups = await getGroups(2, baseLink)
    res.json({groups})
})
const menus = require("./menu")
const axios = require("axios");

let menu = menus["start"]
const getAnswer = async (id, text) => {
    const reply = await new Promise(resolve => {
        bot.sendMessage(id, text, {
            reply_markup: JSON.stringify({force_reply: true}),
        }).then((msg) => {
            bot.onReplyToMessage(id, msg.message_id, async nameMsg => {
                resolve(nameMsg.text)
            })
        })
    })
    console.log(reply)
    return reply
}
const formUrl = "https://4239-176-105-217-84.eu.ngrok.io"
const {parsing, getGroups} = require("./parsing")
const ChangesUrl = "https://kipt.sumdu.edu.ua/uk/zaminy-na-zavtra"
const Changes = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{text: "Подивитися", web_app: {url: ChangesUrl}}],
        ]
    })
}
let prevdata = []
const checkout = () => {
    axios.get(ChangesUrl)
        .then(async ({data: content}) => {
            const $ = cheerio.load(content)
            // console.log(content)
            const data = $("strong").map((_, i) => {
                return $(i).text()
            }).toArray()
            // console.log(data)
            if (JSON.stringify(data) !== JSON.stringify(prevdata) && prevdata.length > 0) {
                const users = await UserModel.findAll({raw: true, attributes: ["chatId"]})
                users.map(user => {
                    bot.sendMessage(user.chatId, "нові заміни!", Changes)
                    console.log(user)
                })
                prevdata = data
            }
        }).catch(err => console.log(err))
}
setInterval(checkout, 1000 * 60 * 3)

const start = async () => {
    app.listen(5000, () => console.log("server started"))
    await sequelize.authenticate().then(() => {
        console.log("Connection to DB has been established successfully")
    }).catch((error) => {
        console.log(`Connecting DB error -  ${error}`)
    })
    await sequelize.sync()
    await bot.setMyCommands([
        {command: "/start", description: "Головне меню"},
    ])
    bot.on("message", async msg => {
        const {id, last_name: telegram_last_name, first_name: telegram_first_name, username} = msg.chat
        console.log(msg.web_app_data)
        if (msg.web_app_data?.data) {
            const {group, course,lastName,name} = JSON.parse(msg.web_app_data?.data)
            console.log(JSON.parse(msg.web_app_data?.data))
            const user = await UserModel.findOne({chatId:id})
            await user.update({
                status: "student",
                first_name:name,
                last_name:lastName,
                group,
                course
            })
            menu = menus["student"]
            await bot.sendMessage(id, "данні збережено")
            return bot.sendMessage(id, menu.message, menu.menu)
        }
        const {text} = msg
        if (text === "/start") {
            let candidate = await UserModel.findOne({chatId: id})
            if (!candidate) {
                await UserModel.create({
                    chatId:id,
                    telegram_first_name,
                    telegram_last_name,
                    username,
                })
                menu = menus["start"]
                await bot.sendPhoto(id, "https://kipt.sumdu.edu.ua/images/logo_sa1.png")
                await bot.sendMessage(id, "Вас вітає бот КІПФКСумДУ")
                return bot.sendMessage(id, menu.message, menu.menu)

                // const first_name = await getAnswer(id, "Введіть ім'я")
                // const last_name = await getAnswer(id, "Введіть фамілію")
                // await candidate.update({
                //     first_name,
                //     last_name
                // })
            } else {
                console.log(candidate.status)
                menu = menus[candidate.status]
            }
            return await bot.sendMessage(id, menu.message, menu.menu)
        }
        if (msg.reply_to_message) {
            return msg.text
        }
        switch (text) {
            case "Розклад":
                const imageUrl = await parsing(id)
                return bot.sendPhoto(id, imageUrl)
            case "Заміни":

                // axios.get(url).then(res=>{
                //     const $ = cheerio.load(res.data)
                //     const observer = new mutation(async ()=>{
                //         bot.sendMessage(id,"нові заміни")
                //     })
                // })
                return bot.sendMessage(id, "Доступні заміни", Changes)
            case "Підготовка до зно":
                return bot.sendMessage(id,"посилання",{
                    reply_markup:{
                        inline_keyboard:[
                            [{text:"click",url:"https://t.me/RememberEnglishWordBot"}]
                        ]
                    }
                })
            case "Профіль":
                return await bot.sendMessage(id,"/",{
                    reply_markup: JSON.stringify({
                        keyboard: [
                            [{text: "Редагувати", web_app: {url: formUrl}}],
                        ]
                    })
                })
        }
        switch (text) {
            case "Написати заявку на підготовчі курси":
                return bot.sendMessage(id, "Заповніть форму", {
                    reply_markup: JSON.stringify({
                        inline_keyboard: [
                            [{
                                text: "Заповнити",
                                web_app: {url: "https://docs.google.com/forms/d/e/1FAIpQLScTlYUlJasbgJi_QB9Qq5QiOvFavrZFDvdbusUSqd-PvZ1euA/viewform?embedded=true"}
                            }],
                        ]
                    })
                })
            case "Профессії":
                return bot.sendMessage(id, "Ось", {
                    reply_markup: JSON.stringify({
                        selective: true,
                        inline_keyboard: [
                            [{
                                text: "076 Підприємництво, торгівля та біржова діяльність ",
                                url: "https://kipt.sumdu.edu.ua/uk/abituriientu/dlya-vipusknikiv-9-11-klasiv/pidpryiemnytstvo-torhivlia-ta-birzhova-diialnist"
                            }],
                            [{
                                text: "141 Електроенергетика, електротехніка та електромеханіка ",
                                url: "https://kipt.sumdu.edu.ua/uk/abituriientu/dlya-vipusknikiv-9-11-klasiv/elektroenerhetyka-elektrotekhnika-ta-elektromekhanika"
                            }],
                            [{
                                text: "192 Будівництво та цивільна інженерія",
                                url: "https://kipt.sumdu.edu.ua/uk/abituriientu/dlya-vipusknikiv-9-11-klasiv/budivnytstvo-ta-tsyvilna-inzheneriia"
                            }],
                            [{
                                text: "231 Соціальна робота",
                                url: "https://kipt.sumdu.edu.ua/uk/abituriientu/dlya-vipusknikiv-9-11-klasiv/sotsialna-robota"
                            }],
                            [{
                                text: "072 Фінанси, банківська справа та страхування ",
                                url: "https://kipt.sumdu.edu.ua/uk/abituriientu/dlya-vipusknikiv-9-11-klasiv/finansy-bankivska-sprava-ta-strakhuvannia"
                            }],
                            [{
                                text: "274 Автомобільний транспорт",
                                url: "https://kipt.sumdu.edu.ua/uk/abituriientu/dlya-vipusknikiv-9-11-klasiv/avtomobilnyi-transport"
                            }],
                            [{
                                text: "121 Інженерія програмного забезпечення",
                                url: "https://kipt.sumdu.edu.ua/uk/abituriientu/dlya-vipusknikiv-9-11-klasiv/inzheneriia-prohramnoho-zabezpechennia"
                            }],
                            [{
                                text: "015 Професійна освіта: Транспорт ",
                                url: "https://kipt.sumdu.edu.ua/uk/abituriientu/dlya-vipusknikiv-dptnz/profesiina-osvita-transport"
                            }],
                            [{
                                text: "015 Професійна освіта: Зварювання ",
                                url: "https://kipt.sumdu.edu.ua/uk/abituriientu/dlya-vipusknikiv-dptnz/profesiina-osvitazvariuvannia"
                            }],
                            [{
                                text: "015 Професійна освіта: Електротехніка ",
                                url: "https://kipt.sumdu.edu.ua/uk/abituriientu/dlya-vipusknikiv-dptnz/profesiina-osvita-elektrotekhnika"
                            }],
                            [{
                                text: "015 Професійна освіта: Будівництво",
                                url: "https://kipt.sumdu.edu.ua/uk/abituriientu/dlya-vipusknikiv-dptnz/profesiina-osvita-budivnytstvo"
                            }],
                            [{
                                text: "015 Професійна освіта : Комп'ютерні технології ",
                                url: "https://kipt.sumdu.edu.ua/uk/abituriientu/dlya-vipusknikiv-dptnz/profesiina-osvita-kompiuterni-tekhnolohii"
                            }],
                        ]
                    })
                })
            case "Матеріальна база":
                return bot.sendMessage(id, ".", {
                    reply_markup: JSON.stringify({
                        keyboard: [
                            [{
                                text: "Лабораторії",
                                web_app: {url: "https://kipt.sumdu.edu.ua/uk/koledzh/materialna-baza/laboratorii"}
                            }],
                            [{
                                text: "Гуртожитки",
                                web_app: {url: "https://kipt.sumdu.edu.ua/uk/koledzh/materialna-baza/hurtozhytky"}
                            }],
                            [{
                                text: "Майстерні",
                                web_app: {url: "https://kipt.sumdu.edu.ua/uk/koledzh/materialna-baza/maisterni"}
                            }],
                            [{
                                text: "Кабінети",
                                web_app: {url: "https://kipt.sumdu.edu.ua/uk/koledzh/materialna-baza/kabinety"}
                            }],
                            [{
                                text: "Спортивний комплекс ",
                                web_app: {url: "https://kipt.sumdu.edu.ua/uk/koledzh/materialna-baza/sportyvnyi-kompleks"}
                            }],
                            [{
                                text: "Бібліотека",
                                web_app: {url: "https://kipt.sumdu.edu.ua/uk/koledzh/materialna-baza/biblioteka"}
                            }],
                            [{
                                text: "Їдальня",
                                web_app: {url: "https://kipt.sumdu.edu.ua/uk/koledzh/materialna-baza/yidalnia"}
                            }],
                            [{
                                text: "МЕДИЧНИЙ КАБІНЕТ",
                                web_app: {url: "https://kipt.sumdu.edu.ua/uk/koledzh/materialna-baza/medychnyi-kabinet"}
                            }]
                        ]
                    })
                })
        }
        switch (text) {
            case "студент":
                return bot.sendMessage(id, "вкажіть свої данні", {
                    reply_markup: JSON.stringify({
                        keyboard: [
                            [{text: "Вказати", web_app: {url: formUrl}}],
                        ]
                    })
                })
            case "абітуріент":
                await UserModel.create({

                    status: "abiturient",
                    username
                })
                menu = menus["abiturient"]
                return bot.sendMessage(id, menu.message, menu.menu)
            case "гість":
                break;

        }
        return bot.sendMessage(id, "unknown command " + msg.text)
    })
    bot.on("callback_query", async msg => {
        const {data} = msg
        const {id} = msg.message.chat
        console.log(msg)
    })
}
start()