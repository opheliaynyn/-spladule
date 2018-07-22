'use strict';
const functions = require('firebase-functions');
const { dialogflow } = require('actions-on-google');

const app = dialogflow({
    // 認証用ヘッダ
    verification: { 'Authorization': 'Bearer secret' },
});

var request = require('request');
var async = require('asyncawait/async');
var await = require('asyncawait/await');

app.intent('Default Welcome Intent', conv => {
    // メッセージを言って、ユーザの応答を待機
    conv.ask('スプラジュールです。スケジュールを確認したい、' +
    'マッチ名かルール名を教えてください');
});


var teach = async(function teach(conv, params, input) {
    // スケジュールを教えて終了
    var ret;
    switch (params.TimePeriod) {
        case '今':
            ret = await(getNowSchedule(params.MatchName));
            break;
        case '次':
            ret = await(getNextSchedule(params.MatchName));
            break;
        default:
            // undefinedはここにくる
            ret = await(getNowSchedule(params.MatchName));
            break;
    }
    conv.close(ret);
});

app.intent('Teach Schedule', teach);

// format: 書式フォーマット
var formatDate = function (date, format) {
    format = format.replace(/YYYY/g, date.getFullYear());
    format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2));
    format = format.replace(/DD/g, ('0' + date.getDate()).slice(-2));
    format = format.replace(/HH/g, ('0' + date.getHours()).slice(-2));
    format = format.replace(/mm/g, ('0' + date.getMinutes()).slice(-2));
    format = format.replace(/ss/g, ('0' + date.getSeconds()).slice(-2));
    format = format.replace(/SSS/g, ('00' + date.getMilliseconds()).slice(-3));
    return format;
};

function doRequest(options) {
    return new Promise(function (resolve, reject) {
        request(options, function (error, res, body) {
            if (!error && res.statusCode == 200) {
                resolve(body);
            } else {
                reject(error);
            }
        });
    });
}

var getNowSchedule = async(function (match) {
    var urlMatch;
    var retSchedule;
    var date = new Date();
    var now = await(formatDate(date, 'YYYY-MM-DDTHH:mm:ss'));
    switch (match) {
        case 'ナワバリバトル':
            urlMatch = 'regular/now';
            break;
        case 'ガチマッチ':
            urlMatch = 'gachi/now';
            break;
        case 'リーグマッチ':
            urlMatch = 'league/now';
            break;
        case 'サーモンラン':
            urlMatch = 'coop/schedule';
            break;
        default:
    }
    var options = {
        url: 'https://spla2.yuu26.com/' + urlMatch,
        method: 'GET',
    };

    let ret = JSON.parse(await(doRequest(options)));
    switch (match) {
        case 'ナワバリバトル':
            retSchedule = '現在のナワバリバトルのステージは、'
            + ret.result[0].maps_ex[0].name + 'と'
            + ret.result[0].maps_ex[1].name
            + 'です。終了は、' + zeroSuppress(ret.result[0].end.slice(11, 13))
            + '時です。';
            break;
        case 'ガチマッチ':
            retSchedule = '現在のガチマッチのルールは'
            + ret.result[0].rule + 'で、ステージは、'
            + ret.result[0].maps_ex[0].name + 'と'
            + ret.result[0].maps_ex[1].name
            + 'です。終了は、' + zeroSuppress(ret.result[0].end.slice(11, 13))
            + '時です。';
            break;
        case 'リーグマッチ':
            retSchedule = '現在のリーグマッチのルールは'
            + ret.result[0].rule + 'で、ステージは、'
            + ret.result[0].maps_ex[0].name + 'と'
            + ret.result[0].maps_ex[1].name
            + 'です。終了は、' + zeroSuppress(ret.result[0].end.slice(11, 13))
            + '時です。';
            break;
        case 'サーモンラン':
            var start = ret.result[0].start;
            var end = ret.result[0].end;
            if (!(start <= now && now <= end)) {
                retSchedule = '現在、サーモンランは行われていません。';
                break;
            }

            retSchedule = '現在のサーモンランのステージは、'
            + ret.result[0].stage.name + 'です。終了は、'
            + ret.result[0].end.slice(0, 4) + '年'
            + zeroSuppress(ret.result[0].end.slice(5, 7)) + '月'
            + zeroSuppress(ret.result[0].end.slice(8, 10)) + '日'
            + zeroSuppress(ret.result[0].end.slice(11, 13))
            + '時までです。支給ブキは、';
            for (var i = 0; i < 4; i++) {
                retSchedule += ret.result[0].weapons[i].name + '、';
            }
            retSchedule += 'です。'
            break;
        default:
    }

    return retSchedule;
})

function getNextSchedule(match){
    var urlMatch;
    var retSchedule;
    var date = new Date();
    var now = formatDate(date, 'YYYY-MM-DDTHH:mm:ss');
    switch (match) {
        case 'ナワバリバトル':
            urlMatch = 'regular/next';
            break;
        case 'ガチマッチ':
            urlMatch = 'gachi/next';
            break;
        case 'ガチエリア':
        case 'ガチホコ':
        case 'ガチヤグラ':
        case 'ガチアサリ':
            urlMatch = 'gachi/next_all';
            break;
        case 'リーグマッチ':
            urlMatch = 'league/next';
            break;
        case 'サーモンラン':
            urlMatch = 'coop/schedule';
            break;
        default:
    }
    var options = {
        url: 'https://spla2.yuu26.com/' + urlMatch,
        method: 'GET',
    };

    let ret = JSON.parse(await(doRequest(options)));
    switch (match) {
        case 'ナワバリバトル':
            retSchedule = '次のナワバリバトルのステージは、'
            + ret.result[0].maps_ex[0].name + 'と'
            + ret.result[0].maps_ex[1].name
            + 'です。開始は、' + ret.result[0].start(11, 13) + '時からです。';
            break;
        case 'ガチマッチ':
            retSchedule = '次のガチマッチのルールは'
            + ret.result[0].rule + 'で、ステージは、'
            + ret.result[0].maps_ex[0].name + 'と'
            + ret.result[0].maps_ex[1].name
            + 'です。開始は、' + ret.result[0].start(11, 13) + '時からです。';
            break;
        case 'リーグマッチ':
            retSchedule = '次のリーグマッチのルールは'
             + ret.result[0].rule + 'で、ステージは、'
            + ret.result[0].maps_ex[0].name + 'と'
             + ret.result[0].maps_ex[1].name
            + 'です。開始は、' + ret.result[0].start(11, 13) + '時からです。';
            break;
        case 'ガチエリア':
        case 'ガチホコ':
        case 'ガチヤグラ':
        case 'ガチアサリ':
            for (var i=0;i<ret.result.length;i++) {
                if (ret.result[i].rule == match) {
                    retSchedule = '次の' + match + 'のステージは、'
                    + ret.result[i].maps_ex[0].name + 'と'
                    + ret.result[i].maps_ex[1].name
                    + 'です。開始は、' + ret.result[i].start.slice(0, 4) + '年'
                    + zeroSuppress(ret.result[i].start.slice(5, 7)) + '月'
                    + zeroSuppress(ret.result[i].start.slice(8, 10)) + '日'
                    + zeroSuppress(ret.result[i].start.slice(11, 13))
                    + '時からです。';
                    break;
                }
            }
            break;
        case 'サーモンラン':
            var start = ret.result[0].start;
            var end = ret.result[0].end;
            var index;
            if (start <= now && now <= end) {
                index = 1;
            }
            else {
                index = 0;
            }

            retSchedule = '次のサーモンランのステージは、'
            + ret.result[index].stage.name + 'です。開始は、'
            + ret.result[index].start.slice(0, 4) + '年'
            + zeroSuppress(ret.result[index].start.slice(5, 7)) + '月'
            + zeroSuppress(ret.result[index].start.slice(8, 10)) + '日'
            + zeroSuppress(ret.result[index].start.slice(11, 13))
            + '時からです。支給ブキは、';
            for (var i = 0; i < 4; i++) {
                retSchedule += ret.result[index].weapons[i].name + '、';
            }
            retSchedule += 'です。'
            break;
        default:
    }

    return retSchedule;
}

//ゼロサプレス
function zeroSuppress( val ) {
    return val.replace( /^0+([0-9]+)/, "$1" );
}

exports.teach = functions.https.onRequest(app);
