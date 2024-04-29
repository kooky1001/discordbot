// const request = require('request');
// const http = require('node:http');
const {weather} = require('#src/config.json');
const {SlashCommandBuilder} = require('discord.js');

/* 날씨 data를 가공 */
function returnTenkiMsg(json) {
    let denki; // 강수형태
    let ondo; // 기온
    let cousui; // 강수량
    let osora; // 하늘상태
    let naiyo; //내용정리
    // let obj = JSON.parse(json);
    // let data = obj.response.body["items"].item;
    let data = json.response.body["items"].item;


    for (var i = 0; i < 10; i++) {
        // console.log("카테고리: "+data[i].category);
        if (data[i].category == "TMP") { // 기온
            ondo = data[i].fcstValue;
            //console.log("온도: " +ondo);

        } else if (data[i].category == "PTY") { // 강수형태
            denki = data[i].fcstValue;
            if (denki == "0") {
                denki = "";
            } else if (denki == "1") {
                denki = " 또한 비가 내리겠습니다.";
            } else if (denki == "2") {
                denki = " 또한 비 혹은 눈이 내리겠습니다.";
            } else if (denki == "3") {
                denki = " 또한 눈이 내리겠습니다.";
            } else if (denki == "4") {
                denki = " 또한 소나기가 내리겠습니다.";
            }
            //console.log("강수형태: "+denki);


        } else if (data[i].category == "PCP") { // 1시간 강수량
            cousui = data[i].fcstValue;

        } else if (data[i].category == "SKY") { // 하늘 상태
            osora = data[i].fcstValue;
            if (osora == "1") {
                osora = ", 하늘이 맑겠습니다.🌞✨";
            } else if (osora == "3") {
                osora = ", 구름이 많겠습니다.⛅";
            } else if (osora == "4") {
                osora = ", 하늘이 흐립니다.☁😥";
            }
            //console.log("하늘상태: "+osora);
        }
    }
    naiyo = "현재 서울 날씨는 기온은 " + ondo + "도 이며" + osora + denki;

    return naiyo;

}

/* 기상청 api 호출 */
function returnTenki(location) {
    return new Promise((resolve, reject) => {
        console.log(location);
        var today = new Date();
        var year = today.getFullYear().toString();
        var month = today.getMonth() + 1;
        month = (month < 10 ? "0" : "") + month.toString();
        var date = today.getDate().toString();
        date = (date < 10 ? "0" : "") + date.toString();
        var hours = today.getHours();
        var minutes = today.getMinutes().toString();

        if (hours == 2 || hours == 5 || hours == 8 || hours == 11 || hours == 14 || hours == 17 || hours == 20 || hours == 23) {
            if (minutes < 25) {
                hours = hours - 1;
            }
        }

        // console.log("타입은? : "+typeof hours);
        //0200, 0500, 0800, 1100, 1400, 1700, 2000, 2300 (1일 8회) 
        switch (hours) {
            case 0:
            case 1:
            case 23:
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

        var day = year + month + date;
        // console.log(day);
        // console.log(hours);

        var url = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst';
        var queryParams = '?' + encodeURIComponent('serviceKey') + '=' + weather; /* Service Key*/
        queryParams += '&' + encodeURIComponent('pageNo') + '=' + encodeURIComponent('1'); /* */
        queryParams += '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent('10'); /* */
        queryParams += '&' + encodeURIComponent('dataType') + '=' + encodeURIComponent('JSON'); /* */
        queryParams += '&' + encodeURIComponent('base_date') + '=' + encodeURIComponent(day); /* */
        queryParams += '&' + encodeURIComponent('base_time') + '=' + encodeURIComponent(hours); /* */
        queryParams += '&' + encodeURIComponent('nx') + '=' + encodeURIComponent('61'); /* */
        queryParams += '&' + encodeURIComponent('ny') + '=' + encodeURIComponent('125'); /* */
        // console.log(url + queryParams);

        fetch(url + queryParams).then(res => res.json())
            .then(body => {
                const data = returnTenkiMsg(body);
                resolve(data);
            }).catch(err => {
            console.log('Error: ', err.message);
            reject(err);
        });
    });

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
        let location = null;
        if (interaction.options.get('지역')) location = interaction.options.get('지역').value;
        await returnTenki(location).then(body => {
            interaction.reply(body);
        })
            .catch(error => {
                console.log(error);
                interaction.reply("❌날씨 검색 중 오류가 발생하였습니다.🙃❌");
            });
    },
};