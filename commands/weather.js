// const request = require('request');
// const http = require('node:http');
const {weatherKey} = require('#src/config.json');
const {KakaoAK} = require('#src/config.json');
const {SlashCommandBuilder} = require('discord.js');

/* 날씨 data를 가공 */
function getWeatherMessage(json, name) {
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
                default :
                    type = "";
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
    message = `현재 ${name} 날씨는 기온은 ${temperature}도 이며, ${sky}${type}`;

    return message;
}

/* 기상청 api 호출 */
function getWeather(region) {
    return new Promise(async (resolve, reject) => {
        let gps;
        await getGPS(region).then(data => {
            gps = data;
        }).catch(error => {
            console.log('처음')
            console.log(error);
            reject(error);
        });

        if (!gps.name) {
            return;
        }

        let today = dateFormat();
        let day = today.year + today.month + today.date;
        // console.log(day, today.hours, today.minutes);

        const url = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst';
        let queryParams = `?${encodeURIComponent('serviceKey')}=${weatherKey}`; /* Service Key*/
        queryParams += `&${encodeURIComponent('pageNo')}=${encodeURIComponent('1')}`; /* */
        queryParams += `&${encodeURIComponent('numOfRows')}=${encodeURIComponent('10')}`; /* */
        queryParams += `&${encodeURIComponent('dataType')}=${encodeURIComponent('JSON')}`; /* */
        queryParams += `&${encodeURIComponent('base_date')}=${encodeURIComponent(day)}`; /* */
        queryParams += `&${encodeURIComponent('base_time')}=${encodeURIComponent(today.hours)}`; /* */
        queryParams += `&${encodeURIComponent('nx')}=${encodeURIComponent(gps.x)}` /* */
        queryParams += `&${encodeURIComponent('ny')}=${encodeURIComponent(gps.y)}`; /* */
        console.log(url + queryParams);

        fetch(url + queryParams).then(res => res.json())
            .then(body => {
                const data = getWeatherMessage(body, gps.name);
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

async function getGPS(region) {
    let url = "https://dapi.kakao.com/v2/local/search/address.json?query=";
    let headers = {headers: {"Authorization": `KakaoAK ${KakaoAK}`}};
    let gps = {};
    if (!region) {
        region = '서울';
    }
    await fetch(`${url}${region}`, headers).then(res => res.json())
        .then(data => {
            let address = data.documents;
            let x,y;
            if (address.length > 0) {
                address = address[0];

                let xy = dfs_xy_conv('toXY', address.y, address.x);

                gps.x = xy.x;
                gps.y = xy.y;
                gps.name = address.address_name;
            } else {
                throw '검색하신 지역에 대한 정보는 찾을 수 없습니다.';
            }
        });
    return gps;
}

// LCC DFS 좌표변환을 위한 기초 자료
const RE = 6371.00877; // 지구 반경(km)
const GRID = 5.0;      // 격자 간격(km)
const SLAT1 = 30.0;    // 투영 위도1(degree)
const SLAT2 = 60.0;    // 투영 위도2(degree)
const OLON = 126.0;    // 기준점 경도(degree)
const OLAT = 38.0;     // 기준점 위도(degree)
const XO = 43;         // 기준점 X좌표(GRID)
const YO = 136;        // 기1준점 Y좌표(GRID)

/** LCC DFS 좌표변환 ( code : "toXY"(위경도->좌표, v1:위도, v2:경도), "toLL"(좌표->위경도,v1:x, v2:y) ) */
function dfs_xy_conv(code, v1, v2) {
    const DEGRAD = Math.PI / 180.0;
    const RADDEG = 180.0 / Math.PI;

    const re = RE / GRID;
    const slat1 = SLAT1 * DEGRAD;
    const slat2 = SLAT2 * DEGRAD;
    const olon = OLON * DEGRAD;
    const olat = OLAT * DEGRAD;

    let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
    let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
    let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
    ro = re * sf / Math.pow(ro, sn);
    let rs = {};
    if (code == "toXY") {
        rs['lat'] = v1;
        rs['lng'] = v2;
        let ra = Math.tan(Math.PI * 0.25 + (v1) * DEGRAD * 0.5);
        ra = re * sf / Math.pow(ra, sn);
        let theta = v2 * DEGRAD - olon;
        if (theta > Math.PI) theta -= 2.0 * Math.PI;
        if (theta < -Math.PI) theta += 2.0 * Math.PI;
        theta *= sn;
        rs['x'] = Math.floor(ra * Math.sin(theta) + XO + 0.5);
        rs['y'] = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);
    } else {
        rs['x'] = v1;
        rs['y'] = v2;
        let xn = v1 - XO;
        let yn = ro - v2 + YO;
        ra = Math.sqrt(xn * xn + yn * yn);
        if (sn < 0.0) -ra;
        let alat = Math.pow((re * sf / ra), (1.0 / sn));
        alat = 2.0 * Math.atan(alat) - Math.PI * 0.5;

        if (Math.abs(xn) <= 0.0) {
            theta = 0.0;
        } else {
            if (Math.abs(yn) <= 0.0) {
                theta = Math.PI * 0.5;
                if (xn < 0.0) -theta;
            } else
                theta = Math.atan2(xn, yn);
        }
        let alon = theta / sn + olon;
        rs['lat'] = alat * RADDEG;
        rs['lng'] = alon * RADDEG;
    }
    return rs;
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
        let region;
        if (interaction.options.get('지역')) {
            region = interaction.options.get('지역').value;
        }
        await getWeather(region).then(body => {
            interaction.reply(body);
        })
            .catch(error => {
                console.log('마지막')
                console.log(error);
                interaction.reply("❌날씨 검색 중 오류가 발생하였습니다.🙃❌");
            });
    },
};