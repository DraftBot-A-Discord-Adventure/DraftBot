const fs = require('fs');
require('colors');

let weapon = Object.entries((require('data/items/Values.json')).weapon);
let weaponFr = (require('legacy/data/items/fr.json')).weapon;
let weaponEn = (require('legacy/data/items/en.json')).weapon;

weapon.forEach((value, key) => {

  let data = {
    'translations': {
      'fr': weaponFr[value[0]],
      'en': weaponEn[value[0]],
    },
    "rareness": parseInt(value[1].rareness),
    "power": parseInt(value[1].power)
  };

  console.log(` > + ./weapons/${key+1}.json`.green);
  console.log(` > ${JSON.stringify(data).substr(0, 80)}...`.blue);

  if (value[0] === 'default') {
    key = 0;
  } else {
    key += 1;
  }

  fs.writeFile(`ressources/text/weapons/${key}.json`,
      JSON.stringify(data, null, '\t'), () => {});
});
