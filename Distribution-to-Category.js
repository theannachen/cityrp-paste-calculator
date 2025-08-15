const fs = require("fs");

const dist = require("./dist.json")
const conversion = require("./PasteCost.json")

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
            
            
        }
    }
}
console.log(finalDist)
