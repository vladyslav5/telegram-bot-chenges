const UserModel = require("./models");
const axios = require("axios");
const cheerio = require("cheerio");

const baseUrl = `https://kipt.sumdu.edu.ua`
const getGroups = async (pages, link) => {
    let array = []
    for (let i = 0; i < pages; i++) {
        const res = await new Promise(resolve => {
            axios.get(link + `${i * 10}`)
                .then(async (response) => {
                    const {data} = response
                    const $ = cheerio.load(data);
                    const groups = await $(".list-title")
                        .map((_, g) => {
                            const $p = $(g)
                            const href = baseUrl + $p.children().attr('href')
                            const key = $p.text().trim()
                            return {key, href}
                        }).toArray()
                    resolve(groups)
                }).catch(e => {
                console.log(e)
            })
        })
        array.push(...res)
    }
    return array

}
// const baseLink = `https://kipt.sumdu.edu.ua/uk/rozklad-zaniat/${72 + Number(2)}-${2}-kurs?start=`
// parsingPages(2,baseLink).then(async res=>{
//     console.log(res)
//     const user = await UserModel.findOne({chatId: 354782282})
//     const group = res.find(g => g.key == user.group)
//     console.log(group)
// })
const link = "https://kipt.sumdu.edu.ua/uk/zaminy-na-zavtra"
const getChanges = async ()=>{
    const {data} = await axios.get(link)
    const $ = cheerio.load(data)
    const table = $("tr").each((_,elm)=>{
        let s = ""
        const  p = $(elm).find("p").each((i,p)=>{
            const text = $(p).text()
            // if()
            s+= text+ "\t"
        })
        console.log(s)
    })
}
// getChanges(link)
const parsing = async (id) => {
    const baseUrl = "https://kipt.sumdu.edu.ua"
    const user = await UserModel.findOne({chatId: id})
    const baseLink = `https://kipt.sumdu.edu.ua/uk/rozklad-zaniat/${72 + Number(user.course)}-${user.course}-kurs?start=`
    console.log("course",user.course,"base link",baseLink)
    return await new Promise(resolve => {
        getGroups(2, baseLink).then(async res => {
            const group = res.find(g => g.key == user.group)
            // console.log(res)
            axios.get(group.href).then(res => {
                const $ = cheerio.load(res.data)
                $('[itemprop=articleBody]').each((_, i) => {
                    let img = $(i).find("img")
                    // console.log("img",img)
                    if (!$(img).attr("width")) {
                        img = $(i).find("img").next()
                        resolve(baseUrl + $(img).attr("src"))
                    }
                    const url = baseUrl + $(img).attr("src") + "?0"
                    console.log(url)
                    resolve(url)
                })
            })
        })
    })
}
module.exports = {
    parsing,
    getGroups
}