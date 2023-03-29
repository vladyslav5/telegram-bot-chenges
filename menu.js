const menus = {
    "student":{
        message: "Куди направимось ?", menu: {
            reply_markup: {
                keyboard: [["Розклад"], ["Заміни"], ["Підготовка до зно"],["Профіль"]]
            }
        }
    },
    "start":{
        message: "Хто ви ?", menu: {
            reply_markup: {
                keyboard: [
                    [{text: "студент"}, {text: "абітуріент"}], [{text: "гість"}]
                ], resize_keyboard: true, one_time_keyboard: true
            }
        }
    },
    "abiturient":{
        message: "Що буете дивитися?", menu: {
            reply_markup: {
                keyboard: [
                    [{text: "Написати заявку на підготовчі курси"}], [{text: "Профессії"}],[{text: "Матеріальна база"}]
                ], resize_keyboard: true, one_time_keyboard: true
            }
        }
    }
}
module.exports = menus