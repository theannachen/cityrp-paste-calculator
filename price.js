const uuid = "a3dc421f-865a-4215-8aa7-be392e357b3f"
const apiKey = process.env.API_KEY;
const url = "https://api.cityrp.org/citycorp"
const fs = require('fs');

const list = require("./CommodityEquivalence.json")
run()

async function run() {
    fs.writeFileSync("prices.json", "{");
    for(let item of Object.keys(list)){
        let totalPrice = 0;
        let emptyCounts = 0;
        let newObject = {commodities: []}
        for(let commodity of list[item].commodities){
            console.log(commodity)
            if(commodity !== "NONE"){
                try{
                    let res = await fetch(`${url}/commodity?item_name=${commodity}&search_time=MONTH`, {
                        headers: {
                            Authorization: `Basic ${btoa(uuid + ":" + apiKey)}`
                        }
                    })
                    let results = await res.json()
                    if(results.currentBuyPrice <= 0.01){
                        emptyCounts++;
                    }
                    totalPrice += results.currentBuyPrice;
                    newObject.commodities.push({[commodity]: {volumeBought: results.volumeBought, currentBuyPrice: results.currentBuyPrice}})
                }catch(e){
                    console.log(`Error obtaining price for ${commodity}: ` + e)
                }
                await new Promise(r => setTimeout(r, 6000));
            }
        }
        let avgPrice = totalPrice / (Object.keys(list[item].commodities).length - emptyCounts)
        newObject.price = avgPrice
        fs.appendFileSync("prices.json", "\"" + item + "\":" + JSON.stringify(newObject) + ",");
    }
    fs.appendFileSync("prices.json", "}");
}