const fs = require('fs');
require('colors');

let armor = Object.entries((require('data/items/Values.json')).armor);
let armorFr = (require('data/items/fr.json')).armor;
let armorEn = (require('data/items/en.json')).armor;

armor.forEach((value, key) => {

  let data = {
    'translations': {
      'fr': armorFr[value[0]],
      'en': armorEn[value[0]],
    },
    "rareness": parseInt(value[1].rareness),
    "power": parseInt(value[1].power)
  };

  console.log(` > + ./armors/${key+1}.json`.green);
  console.log(` > ${JSON.stringify(data).substr(0, 80)}...`.blue);

  if (value[0] === 'default') {
    key = 0;
  } else {
    key += 1;
  }

  fs.writeFile(`ressources/text/armors/${key}.json`,
      JSON.stringify(data, null, '\t'), () => {});
});
