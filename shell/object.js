const fs = require('fs');
require('colors');

let object = Object.entries((require('data/items/Values.json')).object);
let objectFr = (require('legacy/data/items/fr.json')).object;
let objectEn = (require('legacy/data/items/en.json')).object;

object.forEach((value, key) => {

  let data = {
    'translations': {
      'fr': objectFr[value[0]],
      'en': objectEn[value[0]],
    },
    "rareness": parseInt(value[1].rareness),
    "power": parseInt(value[1].power),
    "nature": parseInt(value[1].nature),
  };

  console.log(` > + ./objects/${key+1}.json`.green);
  console.log(` > ${JSON.stringify(data).substr(0, 80)}...`.blue);

  if (value[0] === 'default') {
    key = 0;
  } else {
    key += 1;
  }

  fs.writeFile(`ressources/text/objects/${key}.json`,
      JSON.stringify(data, null, '\t'), () => {});
});
