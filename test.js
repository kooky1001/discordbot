const {KakaoAK} = require('./config.json');

let url = "https://dapi.kakao.com/v2/local/search/address.json?query=";
let address = "일산"
let headers = {headers : {"Authorization" : `KakaoAK ${KakaoAK}`}}

fetch(`${url}${address}`, headers)
  .then(res => res.json())
  .then(data => console.log(data.documents))
  .catch(err => console.log(err));