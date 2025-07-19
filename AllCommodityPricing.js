const uuid = "a3dc421f-865a-4215-8aa7-be392e357b3f"
const apiKey = process.env.API_KEY;
const url = "https://api.cityrp.org/citycorp"
const fs = require('fs');

run()

async function run(){
    const oldJSON = require('./AllCommodityItems.json');
    const oldLength = oldJSON.length
    console.log(oldJSON.length)

    let res = await fetch(`${url}/commodity/list`, {
        headers:{
            Authorization: `Basic ${btoa(uuid + ":" + apiKey)}`
        }
    })
    let initialList = await res.json()
    let allItems = []
    if(initialList.totalCommodities !== oldLength){
        for(let i = 1; i <= initialList.totalPages; ++i){
            res = await fetch(`${url}/commodity/list?page=${i}`, {
                headers:{
                    Authorization: `Basic ${btoa(uuid + ":" + apiKey)}`
                }
            })

            let pageData = await res.json()
            for(let item of pageData.commodities){
                allItems.push(item.name)
            }
        }

        fs.writeFileSync("AllCommodityItems.json", JSON.stringify(allItems, null, 2));
        console.log("More items added in commodity list. Regathering.")
    }
    else{
        allItems = oldJSON
    }

    let count = 0
    fs.appendFileSync("AllPrices.json", "[");
    for(let item of allItems){
        res = await fetch(`${url}/commodity?item_name=${item}&search_time=MONTH`, {
            headers:{
                Authorization: `Basic ${btoa(uuid + ":" + apiKey)}`
            }
        })
        fs.appendFileSync("AllPrices.json", JSON.stringify(await res.json(), null, 2) + ",\n");
        if(count % 10 === 0){
            console.log("Items counted: " + count)
        }
        count++;
        await new Promise(r => setTimeout(r, 6000));
    }
    fs.appendFileSync("AllPrices.json", "]");
}