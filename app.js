const express = require('express');
const request = require('request');
const app = express();
const port = 3000;

const realtime = 'ew0KICAiYWxnIjogIlJTQS1PQUVQIiwNCiAgImVuYyI6ICJBMTI4R0NNIg0KfQ.NWS1rGfZWWqiRsrzqgO9zaz84gqgQ_5osBkWgtyF-dmCiLaSbY9C1W4Jq6tbHWAOlwdXlaUBYF4K2aZdsf4hrmOi-NSpbwRDFlMW31UA3Gn4Wp6JTD9MBFekJVcqHPRjgVz-dAtZF5lNVSgSIyTtIv3gdGW_sxFyEgZzUFzrpkw.GZe8boRABWMnkHyE.a_1JJh0YVjrDTGSUkHa857B81f_EBv0tjvlsPilCUeejh_NLaJFdN3HquR86lNdFbufGTJnh9Qkk_5K6L2cI22ZmMfw3iYhWiX5XGwTMMkZOVuWIGaMjvYLH5Qg4b5gu-8nOR9zWSm8iFQlLmEcsWSrqAK4aqOLtwsFJVGIjAs9OwTd6YO-eHlnnqv1x_bKdOdWjYx5Q0kxEwoICtyC-Pv7pfNcXD9k7XYlfc1FLBt6PdY5SjkwUlB0iyaFrXXggMsiId8nG.7M8UG46JLQrPCvyV679KAQ';


function getCashFlowAndCapex(company) {
    return new Promise((resolve, reject) => {
        request('https://api-global.morningstar.com/sal-service/v1/stock/financials/v1/'+ 
            company +'/collapsedData?access_token=1RWuAGF2MmUCluijS60wA0ILVZW9', 
            { json: true }, (err, res, body) => {
            if (err) { return reject(err); }
            resolve(body.rows)
        });
    });
}

function getMarketCap(company) {
    const options = {
        url: 'https://api-global.morningstar.com/sal-service/v1/stock/realTime/v3/'+ 
            company +'/data?secExchangeList=&random=0.7796295814543&access_token=tOx7SAYscmA8Oh0nHOiCCdtUnya9',
        headers: {
          'x-api-realtime-e': realtime
        },
        json: true
      };
    return new Promise((resolve, reject) => {
        request(options, 
            (err, res, body) => {
            if (err) { return reject(err); }
            resolve(body.marketCap/10000000)
        });
    });
}

function getOutstandingShares(company) {
    const options = {
        url: 'https://api-global.morningstar.com/sal-service/v1/stock/shortInterest/'+ 
            company +'/data?access_token=tOx7SAYscmA8Oh0nHOiCCdtUnya9',
        headers: {
          'x-api-realtime-e': realtime
        },
        json: true
      };
    return new Promise((resolve, reject) => {
        request(options, 
            (err, res, body) => {
            if (err) { return reject(err); }
            resolve(body.sharesOutstanding*0.1)
        });
    });
}

app.get('/dcf-data/:company', async (req, res) => {
    const [rows, marketCap, sharesOutstanding] = await Promise.all([
        getCashFlowAndCapex(req.params.company),
        getMarketCap(req.params.company),
        getOutstandingShares(req.params.company)
    ])
    const ocf = rows[5];
    const capex = rows[6];
    const ocfData = ocf.datum.map(ele => {
        if (ocf.orderOfMagnitude === 'Mil') {
            return +(+ele).toFixed(2);
        } else if (ocf.orderOfMagnitude === 'Bil') {
            return +(+ele * 1000).toFixed(2);
        }
    }).splice(0, 10).join(" ");
    const capexData = capex.datum.map(ele => {
        if (capex.orderOfMagnitude === 'Mil') {
            return +(+ele).toFixed(2);
        } else if (capex.orderOfMagnitude === 'Bil') {
            return +(+ele * 1000).toFixed(2);
        }
    }).splice(0, 10).join(" ");
    res.json({ocfData, capexData, marketCap, sharesOutstanding});
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))