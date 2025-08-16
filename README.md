# General Scripts: 

## AllCommodityPrices.js
Requires: Your own key to replace it on line 2 along with your UUID 

Instructions: 
Run the command `node AllCommodityPrices.js` from the root directory. 

Output:
All the prices for the current commodities will appear in the `AllPrices.json` file. 

## DistributiontoCategory.js
Requires: A valid `dist.json` file with the format 
```
{
<block> : <quantity (integer)>,
...
}
```

Instructions: 
Run the command `node Distribution-to-Category.js` from the root directory. 

Output:
The resulting distribution will appear in the console.

If there are any blocks that could not be found, it will print it before the distribution. 

## price.js 
Requires: Your own key to replace it on line 2 along with your UUID 

Instructions: 
Run the command `node price.js` from the root directory. 

Output:
All the prices for the current commodities will appear in the `prices.json` file. 
