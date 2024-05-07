const {KakaoAK} = require('#src/config.json');

let url = "https://dapi.kakao.com/v2/local/search/address.json?query=";
let address = "덕소"
let headers = {headers: {"Authorization": `KakaoAK ${KakaoAK}`}}

async function getGPS(region) {
    let url = "https://dapi.kakao.com/v2/local/search/address.json?query=";
    let headers = {headers: {"Authorization": `KakaoAK ${KakaoAK}`}};
    let gps = {};
    await fetch(`${url}${region}`, headers).then(res => res.json())
        .then(data => {
            let address = data.documents;
            console.log(address)
            let x, y;
            if (address.length > 0) {
                address = address[0];
                x = address.x.substring(0, address.x.indexOf('.'));
                y = address.y.substring(0, address.y.indexOf('.'));
                gps.x = x;
                gps.y = y;
            } else {
                throw '검색하신 지역에 대한 정보는 찾을 수 없습니다.';
            }
        })
    // .catch(err => console.log('Error: ', err.message));
    return gps;
}

console.log("test data start============")
getGPS(address).then(data => {
    console.log(data);
});
console.log("test data end============")
// fetch(`${url}${address}`, headers)
//     .then(res => res.json())
//     .then(data => {
//         let 주소 = data.documents;
//         if (주소.length > 0) {
//             a.substring(0, a.indexOf("."));
//             console.log("x", 주소[0].x);
//             console.log("y", 주소[0].y);
//         } else {
//             throw "검색하신 주소는 없습니다.";
//         }
//     }).catch(err => console.log(err));

// console.log(__dirname);



//<!--
//
// LCC DFS 좌표변환을 위한 기초 자료
//
const RE = 6371.00877; // 지구 반경(km)
const GRID = 5.0;      // 격자 간격(km)
const SLAT1 = 30.0;    // 투영 위도1(degree)
const SLAT2 = 60.0;    // 투영 위도2(degree)
const OLON = 126.0;    // 기준점 경도(degree)
const OLAT = 38.0;     // 기준점 위도(degree)
const XO = 43;         // 기준점 X좌표(GRID)
const YO = 136;        // 기1준점 Y좌표(GRID)

let xy = dfs_xy_conv('toXY', '37.5956028555424', '127.217844244697');
console.log(xy)
//
// LCC DFS 좌표변환 ( code : "toXY"(위경도->좌표, v1:위도, v2:경도), "toLL"(좌표->위경도,v1:x, v2:y) )
//
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