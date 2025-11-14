const fs = require("fs");

const dist = require("./mats.json")
const conversion = require("./PasteCost.json")
const costs = require("./CategoryPricing.json")

let finalDist = {}

for(let block of Object.keys(dist)){
    if(dist[block] !== 0){
        if(conversion[block]){
            let conversionObject = Object.keys(conversion[block])[0]
            let count = parseFloat(conversion[block][conversionObject]) * dist[block]

            if(finalDist[conversionObject]){
                finalDist[conversionObject] += count
            }
            else{
                finalDist[conversionObject] = count
            }

            if(Object.keys(conversion[block])[1] !== "price"){
                let conversionObjectTwo = Object.keys(conversion[block])[1]
                let count = parseFloat(conversion[block][conversionObjectTwo]) * dist[block]

                if(finalDist[conversionObjectTwo]){
                    finalDist[conversionObjectTwo] += count
                }
                else{
                    finalDist[conversionObjectTwo] = count
                }
            }
            
        }
        else{
            console.log(block)
        }
    }
}

for(let item of Object.keys(finalDist)){
    finalDist[item]= finalDist[item]+ ": " +finalDist[item] * costs[item] 
}

console.log(finalDist);

