// const request = require('request');
// const http = require('node:http');
const {weatherKey} = require('#src/config.json');
const {SlashCommandBuilder} = require('discord.js');

/* 날씨 data를 가공 */
function returnWeatherMessage(json) {
    let type; // 강수형태
    let temperature; // 기온
    let precipitation; // 강수량
    let sky; // 하늘상태
    let message; //내용정리
    // let obj = JSON.parse(json);
    // let data = obj.response.body["items"].item;
    let data = json.response.body["items"].item;

    for (var i = 0; i < 10; i++) {
        let category = data[i].category;
        let value = data[i].fcstValue;
        if (category === "TMP") { // 기온
            temperature = value;
        } else if (category === "PTY") { // 강수형태
            type = value;
            switch (type) {
                case 0 :
                    type = "";
                    break;
                case 1 :
                    type = " 또한 비가 내리겠습니다.";
                    break;
                case 2 :
                    type = " 또한 비 혹은 눈이 내리겠습니다.";
                    break;
                case 3 :
                    type = " 또한 눈이 내리겠습니다.";
                    break;
                case 4 :
                    type = " 또한 소나기가 내리겠습니다.";
                    break;
                default : type = "";
                break;
            }
        } else if (category === "PCP") { // 1시간 강수량
            precipitation = value;
        } else if (category === "SKY") { // 하늘 상태
            sky = value;
            if (sky === "1") {
                sky = "하늘이 맑겠습니다.🌞✨";
            } else if (sky === "3") {
                sky = "구름이 많겠습니다.⛅";
            } else if (sky === "4") {
                sky = "하늘이 흐립니다.☁😥";
            }
        }
    }
    message = `현재 서울 날씨는 기온은 ${temperature}도 이며, ${sky}${type}`;

    return message;
}

/* 기상청 api 호출 */
function returnWeather(location) {
    return new Promise((resolve, reject) => {
        console.log(location);

        var today = dateFormat();

        var day = today.year + today.month + today.date;
        // console.log(day, today.hours, today.minutes);

        const url = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst';
        let queryParams = `?${encodeURIComponent('serviceKey')}=${weatherKey}`; /* Service Key*/
        queryParams += `&${encodeURIComponent('pageNo')}=${encodeURIComponent('1')}`; /* */
        queryParams += `&${encodeURIComponent('numOfRows')}=${encodeURIComponent('10')}`; /* */
        queryParams += `&${encodeURIComponent('dataType')}=${encodeURIComponent('JSON')}`; /* */
        queryParams += `&${encodeURIComponent('base_date')}=${encodeURIComponent(day)}`; /* */
        queryParams += `&${encodeURIComponent('base_time')}=${encodeURIComponent(today.hours)}`; /* */
        queryParams += `&${encodeURIComponent('nx')}=${encodeURIComponent('61')}` /* */
        queryParams += `&${encodeURIComponent('ny')}=${encodeURIComponent('125')}`; /* */
        // console.log(url + queryParams);

        fetch(url + queryParams).then(res => res.json())
            .then(body => {
                const data = returnWeatherMessage(body);
                resolve(data);
            }).catch(err => {
            console.log('Error: ', err.message);
            reject(err);
        });
    });

}

function dateFormat() {
    let today = new Date();
    let year = today.getFullYear();
    let month = ('0' + (today.getMonth() + 1)).slice(-2);
    let date = ('0' + today.getDate()).slice(-2);
    let hours = today.getHours();
    let minutes = today.getMinutes().toString();

    if (hours % 3 === 2) {
        if (minutes < 25) {
            hours = hours - 1;
        }
    }

    //0200, 0500, 0800, 1100, 1400, 1700, 2000, 2300 (1일 8회)
    switch (hours) {
        case 23:
        case 0:
        case 1:
            date = date - 1;
            hours = "2300";
            break;
        case 2:
        case 3:
        case 4:
            hours = "0200";
            break;
        case 5:
        case 6:
        case 7:
            hours = "0500";
            break;
        case 8:
        case 9:
        case 10:
            hours = "0800";
            break;
        case 11:
        case 12:
        case 13:
            hours = "1100";
            break;
        case 14:
        case 15:
        case 16:
            hours = "1400";
            break;

        case 17:
        case 18:
        case 19:
            hours = "1700";
            break;
        case 20:
        case 21:
        case 22:
            hours = "2000";
            break;
    }

    return {"year": year, "month": month, "date": date, "hours": hours, "minutes": minutes};
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('날씨')
        .setDescription('날씨를 응답합니다.')
        .addStringOption(option =>
            option.setName('지역')
                .setDescription('날씨를 알고싶은 지역을 입력합니다.')
        ),
    async execute(interaction) {
        let location;
        if (interaction.options.get('지역')) {
            location = interaction.options.get('지역').value;
        }
        await returnWeather(location).then(body => {
            interaction.reply(body);
        })
            .catch(error => {
                console.log(error);
                interaction.reply("❌날씨 검색 중 오류가 발생하였습니다.🙃❌");
            });
    },
};