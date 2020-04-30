const fs = require('fs');
require('colors');

let potion = Object.entries((require('data/items/Values.json')).potion);
let potionFr = (require('legacy/data/items/fr.json')).potion;
let potionEn = (require('legacy/data/items/en.json')).potion;

potion.forEach((value, key) => {

  let data = {
    'translations': {
      'fr': potionFr[value[0]],
      'en': potionEn[value[0]],
    },
    "rareness": parseInt(value[1].rareness),
    "power": parseInt(value[1].power),
    "nature": parseInt(value[1].nature),
  };

  console.log(` > + ./potions/${key+1}.json`.green);
  console.log(` > ${JSON.stringify(data).substr(0, 80)}...`.blue);

  if (value[0] === 'default') {
    key = 0;
  } else {
    key += 1;
  }

  fs.writeFile(`ressources/text/potions/${key}.json`,
      JSON.stringify(data, null, '\t'), () => {});
});
